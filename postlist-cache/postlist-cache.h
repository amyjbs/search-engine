#define __1MB__ (1024 << 10)
#define MB * __1MB__

#include "math-postlist-cache.h"
#include "term-postlist-cache.h"

#include "term-index/term-index.h"
#include "math-index/math-index.h"

struct postlist_cache {
	struct math_postlist_cache math_cache;
	struct term_postlist_cache term_cache;
	size_t tot_used, tot_limit;
};

struct postlist_cache postlist_cache_new();

int postlist_cache_fork(struct postlist_cache*,
                        term_index_t, math_index_t);

void postlist_cache_free(struct postlist_cache);

void postlist_cache_printinfo(struct postlist_cache);
