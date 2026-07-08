// DARK AI Movie Cache Registry
// Client-Side In-Memory Cache for Instant Modal Rendering
(function() {
    class MovieRegistry {
        constructor() {
            this.cache = new Map(); // movieId (number) -> movie object
            this.pendingRequests = new Map(); // movieId (number) -> Promise
            this.abortControllers = new Map(); // movieId (number) -> AbortController
        }

        set(id, data) {
            if (!id) return;
            const numId = Number(id);
            const existing = this.cache.get(numId) || {};
            this.cache.set(numId, { ...existing, ...data });
        }

        get(id) {
            if (!id) return null;
            return this.cache.get(Number(id)) || null;
        }

        has(id) {
            if (!id) return false;
            return this.cache.has(Number(id));
        }

        getOrCreatePromise(id, fetchFn) {
            const numId = Number(id);
            if (this.pendingRequests.has(numId)) {
                return this.pendingRequests.get(numId);
            }
            const promise = fetchFn().finally(() => {
                this.pendingRequests.delete(numId);
            });
            this.pendingRequests.set(numId, promise);
            return promise;
        }

        cancelRequest(id) {
            const numId = Number(id);
            const controller = this.abortControllers.get(numId);
            if (controller) {
                try {
                    controller.abort();
                } catch (e) {}
                this.abortControllers.delete(numId);
            }
        }

        createController(id) {
            const numId = Number(id);
            this.cancelRequest(numId);
            const controller = new AbortController();
            this.abortControllers.set(numId, controller);
            return controller;
        }
    }

    window.movieRegistry = new MovieRegistry();
})();
