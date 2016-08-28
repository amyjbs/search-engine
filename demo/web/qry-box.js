$(document).ready(function() {
	var MQ = MathQuill.getInterface(2);

	var query = {
		"raw_str": "",
		"items": [
			{"type": "term-input", "str": ""}
		]
	};

	/* query variable <--> raw query string convert */
	var raw_str_2_query = function() {
		var q = query;
		var dollar_open = false;
		var kw_arr = [];
		var kw = '';

		/* get keyword array splitted by commas */
		for (var i = 0; i < q.raw_str.length; i++) {
			if (q.raw_str[i] == '$') {
				if (dollar_open)
					dollar_open = false;
				else
					dollar_open = true;
			}

			if (!dollar_open && q.raw_str[i] == ',') {
				kw_arr.push(kw);
				kw = '';
			} else {
				kw += q.raw_str[i];
			}
		}
		kw_arr.push(kw);

		/* for each of the keyword, add into query */
		q.items = []; /* clear */
		$.each(kw_arr, function(i, kw) {
			kw = $.trim(kw);
			if (kw == "")
				return true; /* continue */

			if (kw[0] == "$") {
				var s = kw.replace(/^\$|\$$/g, "");
				q.items.push({"type":"tex", "str": s});
			} else {
				var s = kw;
				q.items.push({"type":"term", "str": s});
			}
		});

		q.items.push({"type": "term-input", "str": ""});
	};

	var query_2_raw_str = function() {
		var raw_str_arr = [];
		$.each(query.items, function(i, item) {
			if (item.type == "tex")
				raw_str_arr.push("$" + item.str + "$");
			else
				raw_str_arr.push(item.str);
		});

		query.raw_str = raw_str_arr.slice(0, -1).join(", ");
	};

	/* keyword push/edit */
	var fix_input = function (type, str, then) {
		query.items.pop();
		query.items.push({
			"type": type,
			"str": str
		});
		query.items.push({
			"type": "term-input",
			"str": ""
		});

		query_2_raw_str();

		Vue.nextTick(function () {
			then();
		});
	};

	var switch_to_mq = function (init_tex) {
		query.items.pop();
		query.items.push({
			"type": "tex-input",
			"str": init_tex
		});

		Vue.nextTick(function () {
			var mq = render_mq_edit();
			mq.latex(init_tex);
		});
	};

	var switch_to_mq_2 = function (usr_type_str) {
		query.items.pop();
		query.items.push({
			"type": "tex-input",
			"str": usr_type_str
		});

		Vue.nextTick(function () {
			var mq = render_mq_edit();
			mq.typedText(usr_type_str);
		});
	};

	var render_mq_edit = function () {
		var ele = document.getElementById("math-input");
		var mq = MQ.MathField(ele, {
			handlers: {
				edit: function() {
					var arr = query.items;
					input_box = arr[arr.length - 1];
					input_box.str = mq.latex();
				},
				enter: function() {
					if (mq.latex() == '')
						return;

					fix_input("tex", mq.latex(), function() {
						tex_render("div.qry-div-fix");
						setTimeout(function () {
							$("#qry-input-box").focus();
						}, 500);
					});
				}
			}
		});

		mq.focus();
		return mq;
	};

	function contains(str, substr) {
		for (i = 0; i < substr.length; i ++) {
			var c = substr[i];
			if (str.indexOf(c) > -1)
				return 1;
		}

		return 0;
	}

	var input_box_on_keyup = function (ev) {
		arr = query.items;
		input_box = arr[arr.length - 1];

		if (ev.which == 13 /* enter */) {
			if (input_box.str == '') {
				/* think this as search signal */
				click_search(1, true);
			} else {
				/* replace all commas into space */
				input_box.str = input_box.str.replace(/,/g, " ");

				/* add this "term" keyword */
				fix_input("term", input_box.str,function() {
					$("#qry-input-box").focus();
				});
			}
		} else if (contains(input_box.str, "$")) {
			/* user input a '$' signe */

			/* split by this '$', assume it is the last char */
			if (input_box.str.length > 1) {
				var head_str = input_box.str.slice(0, -2);
				fix_input("term", head_str,function() {});
			}

			switch_to_mq("");

		} else if (contains(input_box.str, ".'+-*/\\!^_%()[]:;{}=<>")) {
			switch_to_mq_2(input_box.str);
		}
	};

	/* Vue instance */
	var qry_vm = new Vue({
		el: "#qry-input-vue-app",
		data: query,
		computed: { /* computed property */
			enc_uri: function () {
				return encodeURIComponent(this.raw_str);
			},
			url_root: function () {
				return location.origin + location.pathname;
			}
		},
		methods: {
			area_on_click: function (ev) {
				$("#qry-input-box").focus();
			},
			on_input: input_box_on_keyup,
			on_rawinput: function () {
				raw_str_2_query();
				Vue.nextTick(function () {
					tex_render("div.qry-div-fix");
				});
			}
		}
	});

	/* on keyword editing */
	window.dele_kw = function (idx) {
		query.items.splice(idx, 1);
		query_2_raw_str();

		raw_str_2_query();
		Vue.nextTick(function () {
			tex_render("div.qry-div-fix");
		});
	};

	window.edit_kw = function (idx) {
		save_str = query.items[idx].str;
		dele_kw(idx);
		switch_to_mq(save_str);
	};

	/* expander */
	$("span.collapse").next().hide();
	$("span.collapse").click(function () {
		head = $(this);
		below = head.next();
		below.toggle("fast", function () {
			t = head.text();
			if (below.is(":visible"))
				t = t.replace("+", "-");
			else
				t = t.replace("-", "+");
			head.text(t);

			$('#init-footer').stickToBottom();
		});
	});

	/* search related */
	function click_search(page, is_pushState) {
		arr = query.items;
		input_box = arr[arr.length - 1];

		if (input_box.str != '') {
			if (input_box.type == 'tex-input') {
				fix_input("tex", input_box.str, function() {
					tex_render("div.qry-div-fix");
					qry = $("#qry").val();

					srch_qry(qry, page, is_pushState);
				});
				return;

			} else if (input_box.type == 'term-input') {
				fix_input("term", input_box.str, function() {
					qry = $("#qry").val();
					srch_qry(qry, page, is_pushState);
				});
				return;
			}
		}

		qry = $("#qry").val();
		srch_qry(qry, page, is_pushState);

		quiz_hide();
	}

	$('#search_button').on('click', function() {
		click_search(1, true);
	});

	window.type_and_click_search =
	function (qry, page, is_pushState) {
//		console.log('search: ' + raw_qry_str);
		query.raw_str = qry;
		raw_str_2_query();
		Vue.nextTick(function () {
			tex_render("div.qry-div-fix");
			click_search(page, is_pushState);
		});
	};
});