import nanoid from "nanoid";
import { Request, NextFunction } from "express";
import {
  CachedResponse,
  Chunk,
  ExtendedResponse,
  Options,
  PurgeFunction
} from "./types";
import { returnCachedResponse } from "./response";
import { memoryStore } from "./stores/memory.store";
import { cacheChunk, sealChunks } from "./chunk";
import { Queue } from "./utils";
import { defaultGetCacheKey } from "./cache-key";
import { defaultOnCacheHit, defaultOnCacheMiss } from "./cache-behavior";

const defaultOptions = {
  maxAge: undefined,
  store: memoryStore(),
  getCacheKey: defaultGetCacheKey,
  getCacheTag: undefined,
  onCacheHit: defaultOnCacheHit,
  onCacheMiss: defaultOnCacheMiss
};

export const expressAggressiveCache = (options?: Options) => {
  const {
    debug,
    maxAge: defaultMaxAge,
    store,
    getCacheKey,
    getCacheTag,
    onCacheHit,
    onCacheMiss
  } = {
    ...defaultOptions,
    ...options
  };

  const log = (...msg: any[]) => {
    if (!debug) return;

    // eslint-disable-next-line no-console
    console.log(...msg);
  };

  const responseBucket = store<CachedResponse>();
  const chunkBucket = store<Chunk>();
  const cacheKeyBucket = store<string>();

  const purge: PurgeFunction = async (cacheTag: string) => {
    throw new Error(
      `purge for cache tag ${cacheTag} not implemented - API could still change - do not use`
    );
  };

  const updateCacheKeyBucketOptional = async (
    req: Request,
    res: ExtendedResponse,
    cacheKey: string
  ) => {
    if (getCacheTag) {
      const cacheTag = await getCacheTag({ req, res });
      if (cacheTag !== undefined) {
        await cacheKeyBucket.set(cacheTag, cacheKey);
      }
    }
  };

  const checkAndHandleCacheHit = async (
    cachedResponse: CachedResponse | undefined,
    req: Request,
    res: ExtendedResponse,
    cacheKey: string
  ) => {
    if (cachedResponse?.isSealed) {
      if (await chunkBucket.has(cachedResponse.chunks)) {
        log("HIT:", cacheKey);
        await onCacheHit({ req, res });
        await returnCachedResponse(res, cachedResponse, chunkBucket);
        return true;
      } else {
        log("chunk missing");
      }
    }
    return false;
  };

  const handleCacheMiss = async (
    req: Request,
    res: ExtendedResponse,
    onFinish: () => void,
    onWrite: (chunk: Chunk | undefined) => void,
    cacheKey: string
  ) => {
    log("MISS - key not found:", cacheKey);
    await onCacheMiss({ req, res });
    await updateCacheKeyBucketOptional(req, res, cacheKey);

    const originalWrite: any = res.write;
    const originalEnd: any = res.end;

    res.write = function write(...args: any[]) {
      onWrite(args[0]);
      return originalWrite.call(this, ...args);
    };

    res.end = function end(...args: any[]) {
      onWrite(args[0]);
      return originalEnd.call(this, ...args);
    };

    res.on("finish", onFinish);
  };

  const handleNonGetRequestsAsCacheMiss = async (
    req: Request,
    res: ExtendedResponse
  ) => {
    if (req.method !== "GET") {
      log("MISS - not a GET request");
      await onCacheMiss({ req, res });
      return true;
    }
    return false;
  };

  const getChunkFunctions = (res: ExtendedResponse, cacheKey: string) => {
    const requestId = nanoid();
    const chunkQueue = new Queue();

    const onWrite = (chunk: Chunk | undefined) => {
      if (chunk !== undefined) {
        chunkQueue
          .push(() =>
            cacheChunk({
              requestId,
              chunk,
              res,
              cacheKey,
              defaultMaxAge,
              log,
              responseBucket,
              chunkBucket,
              chunkQueue
            })
          )
          .run();
      }
    };

    const onFinish = () => {
      chunkQueue
        .push(() =>
          sealChunks({
            requestId,
            cacheKey,
            res,
            log,
            responseBucket
          })
        )
        .run();
    };

    return { onWrite, onFinish };
  };

  return {
    purge,
    middleware: async (
      req: Request,
      res: ExtendedResponse,
      next: NextFunction
    ) => {
      if (await handleNonGetRequestsAsCacheMiss(req, res)) {
        return next();
      }

      const normalizedPath = defaultGetCacheKey({ req });
      const cacheKey = await getCacheKey({ req, res, normalizedPath });

      res.aggressiveCache = {
        chunks: []
      };

      const { onFinish, onWrite } = getChunkFunctions(res, cacheKey);

      const cachedResponse = await responseBucket.get(cacheKey);
      if (await checkAndHandleCacheHit(cachedResponse, req, res, cacheKey)) {
        return;
      } else {
        await handleCacheMiss(req, res, onFinish, onWrite, cacheKey);
        next();
      }
    }
  };
};
