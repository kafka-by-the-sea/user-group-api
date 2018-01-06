$(document).ready(function () {
    /* 設定Query Builder的config */
    var composeFieldDescriptor = function (name, caption, datatype) {
        var field = {
            name: name,
            caption: caption,
            renderer: {
                name: 'textbox'
            },
            __datatype: datatype
        };
        if (datatype == 'integer' || datatype == 'decimal' || datatype == 'datetime' || datatype == 'date') {
            field.conditions = [
                { text: '=', value: '=' },
                { text: '<>', value: '!=' },
                { text: '>', value: '>' },
                { text: '>=', value: '>=' },
                { text: '<', value: '<' },
                { text: '<=', value: '<=' }
            ];
            if (datatype == 'date' || datatype == 'datetime') {
                field.renderer.name = 'datepicker';
            }
        } else if (datatype == 'string') {
            field.conditions = [
                { text: '=', value: '=' },
                { text: '<>', value: '!=' },
                { text: '>', value: '>' },
                { text: '>=', value: '>=' },
                { text: '<', value: '<' },
                { text: '<=', value: '<=' },
                { text: 'like', value: 'like' },
                { text: 'not like', value: '!like' },
            ];
        } else if (datatype == 'boolean') {
            field.conditions = [
                { text: '=', value: '=' },
                { text: '<>', value: '!=' }
            ];
            field.renderer.name = 'dropdownlist';
            field.renderer.values = [
                { text: 'Yes', value: 'true' },
                { text: 'No', value: 'false' }
            ];
        }
        return field;
    };

    /* 建立Query Builder */
    var $builderElem = $('#dataQueryBuilder')
    $builderElem.nrecoConditionBuilder({
        fields: [
            //composeFieldDescriptor('is_active', '', 'boolean'),
            composeFieldDescriptor('total_spend', '總儲值金額', 'integer'),
            composeFieldDescriptor('join_time', '加入日期', 'string'),
        ]
    });

    /* Query Builder預設欄位
    $builderElem.nrecoConditionBuilder('addConditions', [
        { "field": "total_spend", "condition": ">", "value": "100" },
        { "field": "join_time", "condition": ">=", "value": "2017/06/01" },
        { "field": "join_time", "condition": "<=", "value": "2017/06/15" }
    ]); */


    /* 取得JSON格式 */
    $('.queryGetStateJson').click(function () {
        alert(JSON.stringify($builderElem.nrecoConditionBuilder('getConditions')));
    });

    /* 抓SQL參數 */
    function buildSqlCondition(conditionFields, conditionExpr, nullableFields) {
        var expr = conditionExpr.expression;
        var exprWithConditons = "";
        var currentConditionLexem = "";

        var getCurrentConditionStr = function () {
            var conditionIndex = parseInt(currentConditionLexem) - 1;
            if (conditionIndex < 0 || conditionIndex >= conditionFields.length)
                throw "Invalid condition index: " + conditionIndex;
            var f = conditionFields[conditionIndex];

            var sqlVal = f.value.replace(/[']/g, "''");
            if (f.condition == "like" || f.condition == "!like")
                sqlVal = "%" + sqlVal + "%";
            var canBeNull = nullableFields && $.inArray(f.field, nullableFields) >= 0;
            console.log(canBeNull);

            var sqlCondition = f.condition;
            if ((f.condition == "=" || f.condition == "!=") &&
                (
                    ((f.value == null || $.trim(f.value) == "") && canBeNull)
                    ||
                    (f.value == "null")
                )) {
                sqlCondition = f.condition == "=" ? "IS" : "IS NOT";
                sqlVal = "null"
            } else {
                sqlVal = "'" + sqlVal + "'";
            }

            if (sqlCondition == "!=")
                sqlCondition = "<>";

            return f.field + " " + sqlCondition + " " + sqlVal;
        };
        for (var cIdx = 0; cIdx < expr.length; cIdx++) {
            var ch = expr.charAt(cIdx);
            if (ch >= '0' && ch <= '9') {
                currentConditionLexem += ch;
            } else {
                if (currentConditionLexem != "") {
                    exprWithConditons += getCurrentConditionStr();
                    currentConditionLexem = "";
                }
                exprWithConditons += ch;
            }
        }
        if (currentConditionLexem != "") {
            exprWithConditons += getCurrentConditionStr();
        }
        return exprWithConditons;
    };

    /* 取得SQL語法 */
    $('.queryGetStateSql').click(function () {
        var builderConditionsState = $builderElem.nrecoConditionBuilder('getConditions');
        var exprState = $builderElem.nrecoConditionBuilder('getExpression');
        var sqlCondition = buildSqlCondition(builderConditionsState, exprState, ['join_time']);

        $("#result").html('');
        var sql = "select count(id) as total from db_summary.member_action_stats where id>1000 and " + sqlCondition;
        if (sql != '') {
            $.ajax({
                url: "http://192.168.66.222/usergroupAPI/api/getSQLData.php",
                type: "post",
                data: { sql: sql }
            }).done(function (response, textStatus, jqXHR) {
                $("#result").html("總筆數: " + response);
            });
        } else {
            alert('請確認資料都填好了');
        }
    });
    /* Query Builder code 結束 */


    /* 開始做Jquery Ajax CRUD */
    var page = 1;
    var current_page = 1;
    var total_page = 0;
    var is_ajax_fire = 0;

    manageData();

    /* 管理資料列表 */
    function manageData() {
        $.ajax({
            dataType: 'json',
            url: 'http://192.168.66.222/usergroupAPI/api/getData.php',
            data: { page: page }
        }).done(function (data) {
            total_page = Math.ceil(data.total / 10);
            current_page = page;

            $('#pagination').twbsPagination({
                totalPages: total_page,
                visiblePages: current_page,
                onPageClick: function (event, pageL) {
                    page = pageL;
                    if (is_ajax_fire != 0) {
                        getPageData();
                    }
                }
            });

            manageRow(data.data);
            is_ajax_fire = 1;
        });
    }

    /* 取得page */
    function getPageData() {
        $.ajax({
            dataType: 'json',
            url: 'http://192.168.66.222/usergroupAPI/api/getData.php',
            data: { page: page }
        }).done(function (data) {
            manageRow(data.data);
        });
    }

    /* 新增資料在表格的row */
    function manageRow(data) {
        var rows = '';
        $.each(data, function (key, value) {
            rows = rows + '<tr>';
            rows = rows + '<td>' + value.name + '</td>';
            rows = rows + '<td>' + value.description + '</td>';
            rows = rows + '<td>' + value.status + '</td>';
            rows = rows + '<td>' + value.rule_type + '</td>';
            rows = rows + '<td>' + value.rule + '</td>';
            rows = rows + '<td data-id="' + value.id + '">';
            rows = rows + '<button data-toggle="modal" data-target="#edit-item" class="btn btn-primary edit-item">Edit</button> ';
            rows = rows + '<button class="btn btn-danger remove-item">Delete</button>';
            rows = rows + '</td>';
            rows = rows + '</tr>';
        });

        $("tbody").html(rows);
    }

    /* 新增資料: 按下送出按鈕 */
    $(".crud-submit").click(function (e) {
        e.preventDefault();
        var form_action = $("#create-item").find("form").attr("action");
        var name = $("#create-item").find("input[name='name']").val();
        var description = $("#create-item").find("input[name='description']").val();
        var status = $("#create-item").find("input[name='status']").val();
        var rule_type = $("#create-item").find("input[name='rule_type']").val();
        var rule = JSON.stringify($builderElem.nrecoConditionBuilder('getConditions'));

        var builderConditionsState = $builderElem.nrecoConditionBuilder('getConditions');
        var exprState = $builderElem.nrecoConditionBuilder('getExpression');
        var sqlCondition = buildSqlCondition(builderConditionsState, exprState, ['join_time']);
        var sql_command = "select id from db_summary.member_action_stats where id>1000 and " + sqlCondition;


        if (name != '' && rule != '') {
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: 'http://192.168.66.222/usergroupAPI/' + form_action,
                data: { name: name, description: description, status: status, rule_type: rule_type, rule: sql_command, sql_command: sql_command }
            }).done(function (data) {
                $("#create-item").find("input[name='name']").val('');
                $("#create-item").find("input[name='description']").val('');
                $("#create-item").find("input[name='status']").val('');
                $("#create-item").find("input[name='rule_type']").val('');
                getPageData();
                $(".modal").modal('hide');
                toastr.success('新增成功', '提示', { timeOut: 2000 });
            });
        } else {
            alert('請確認資料都填好了');
        }
    });

    /* 刪除一筆資料 */
    $("body").on("click", ".remove-item", function () {
        var id = $(this).parent("td").data('id');
        var c_obj = $(this).parents("tr");

        $.ajax({
            dataType: 'json',
            type: 'POST',
            url: 'http://192.168.66.222/usergroupAPI/api/delete.php',
            data: { id: id }
        }).done(function (data) {
            c_obj.remove();
            toastr.success('刪除成功', '提示', { timeOut: 2000 });
            getPageData();
        });

    });


    /* 編輯一筆資料 */
    $("body").on("click", ".edit-item", function () {
        var id = $(this).parent("td").data('id');
        var name = $(this).parent("td").prev("td").prev("td").prev("td").prev("td").prev("td").text();
        var description = $(this).parent("td").prev("td").prev("td").prev("td").prev("td").text();
        var status = $(this).parent("td").prev("td").prev("td").prev("td").text();
        var rule_type = $(this).parent("td").prev("td").prev("td").text();
        //var rule = $(this).parent("td").prev("td").text();

        $("#edit-item").find("input[name='name']").val(name);
        $("#edit-item").find("input[name='description']").val(description);
        $("#edit-item").find("input[name='status']").val(status);
        $("#edit-item").find("input[name='rule_type']").val(rule_type);
        //$("#edit-item").find("textarea[name='rule']").val(rule);
        $("#edit-item").find(".edit-id").val(id);
        /*
        var $queryBuilder = $("#edit-item").find("#test123");
        $queryBuilder.nrecoConditionBuilder({
            fields: [
                composeFieldDescriptor('total_spend', '總儲值金額', 'integer'),
                composeFieldDescriptor('join_time', '加入日期', 'string'),
            ]
        });

        var obj = jQuery.parseJSON(rule);
        $queryBuilder.nrecoConditionBuilder('addConditions', obj);
        */

    });

    /* 編輯用的Query Builder */
    var $queryBuilderEdit = $('#queryBuilder'); //div
    $queryBuilderEdit.nrecoConditionBuilder({
        fields: [
            composeFieldDescriptor('total_spend', '總儲值金額', 'integer'),
            composeFieldDescriptor('join_time', '加入日期', 'string'),
        ]
    });

    $('.queryGetStateSqlEdit').click(function () {
        var builderConditionsStateEdit = $queryBuilderEdit.nrecoConditionBuilder('getConditions');
        var exprStateEdit = $queryBuilderEdit.nrecoConditionBuilder('getExpression');
        var sqlConditionEdit = buildSqlCondition(builderConditionsStateEdit, exprStateEdit, ['join_time']);

        $("#result").html('');
        var sqlEdit = "select count(id) as total from db_summary.member_action_stats where id>1000 and " + sqlConditionEdit;
        if (sqlEdit != '') {
            $.ajax({
                url: "http://192.168.66.222/usergroupAPI/api/getSQLData.php",
                type: "post",
                data: { sql: sqlEdit }
            }).done(function (response, textStatus, jqXHR) {
                $("#resultEdit").html("總筆數: " + response);
            });
        } else {
            alert('請確認資料都填好了');
        }
    });

    /* 更新一筆資料 */
    $(".crud-submit-edit").click(function (e) {

        e.preventDefault();
        var form_action = $("#edit-item").find("form").attr("action");
        var name = $("#edit-item").find("input[name='name']").val();
        var description = $("#edit-item").find("input[name='description']").val();
        var status = $("#edit-item").find("input[name='status']").val();
        var rule_type = $("#edit-item").find("input[name='rule_type']").val();
        //var rule = $("#edit-item").find("textarea[name='rule']").val();
        var id = $("#edit-item").find(".edit-id").val();

        var builderConditionsStateUpdate = $queryBuilderEdit.nrecoConditionBuilder('getConditions');
        var exprStateUpdate = $queryBuilderEdit.nrecoConditionBuilder('getExpression');
        var sqlConditionUpdate = buildSqlCondition(builderConditionsStateUpdate, exprStateUpdate, ['join_time']);
        var sql_commandUpdate = "select id from db_summary.member_action_stats where id>1000 and " + sqlConditionUpdate;

        if (name != '' && sql_commandUpdate != '') {
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: 'http://192.168.66.222/usergroupAPI/' + form_action,
                data: { name: name, description: description, status: status, rule_type: rule_type, rule: sql_commandUpdate, sql_command: sql_commandUpdate, id: id }
            }).done(function (data) {
                getPageData();
                $(".modal").modal('hide');
                toastr.success('更新成功', '提示', { timeOut: 2000 });
            });
        } else {
            alert('請確認資料都填好了')
        }
    });
    /* Jquery Ajax CRUD code 結束*/
});