#pragma once

#include <stdbool.h>
#include "postmerge/postmerge.h"
#include "indices/indices.h"
#include "mnc-score.h"

struct math_extra_score_arg;

#pragma pack(push, 1)
struct math_expr_score_res {
	doc_id_t  doc_id;
	exp_id_t  exp_id;
	uint32_t  score;
};
#pragma pack(pop)

struct math_expr_sim_factors {
	mnc_score_t mnc_score;
	uint32_t srch_depth;
	uint32_t qry_lr_paths, doc_lr_paths;
	uint32_t *topk_cnt, k, joint_nodes;
	int lcs;
	uint32_t qry_nodes;
	uint64_t qmask;
	uint64_t dmask;
};

void math_expr_set_score(struct math_expr_sim_factors*,
                         struct math_expr_score_res*);

struct math_expr_score_res
math_expr_score_on_merge(struct postmerge*, uint32_t, uint32_t);

struct math_expr_score_res
math_expr_filter_on_merge(struct postmerge*, uint32_t, uint32_t);

uint32_t math_expr_doc_lr_paths(struct postmerge*);

struct math_expr_score_res
math_expr_prefix_score_on_merge(
	uint64_t, struct postmerge*,
	struct math_extra_score_arg*,
	struct indices*
);
