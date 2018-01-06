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
    var $builderElem = $('#dataQueryBuilder');
    $builderElem.nrecoConditionBuilder({
        fields: [
            //composeFieldDescriptor('is_active', '', 'boolean'),
            composeFieldDescriptor('total_payment_amount', '總儲值金額', 'integer'),
            composeFieldDescriptor('join_time', '加入日期', 'date'),
            composeFieldDescriptor('first_payment_amount', '首儲金額', 'integer'),
            composeFieldDescriptor('total_rent_paid_amount', '租48小時付費書籍花費點券', 'integer'),
            composeFieldDescriptor('total_buy_paid_amount', '永久購買付費書籍花費點券', 'integer'),
            composeFieldDescriptor('total_upgrade_amount', '升級書籍花費點券', 'integer'),
            composeFieldDescriptor('total_bonus_event', '所有活動贈點', 'integer'),
            composeFieldDescriptor('total_spend', '總消費點券', 'integer'),
        ]
    });

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

    /* 預先計算總筆數 */
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
    var currentPage = 1;
    var totalPage = 0;
    var isAjaxFire = 0;

    manageData();

    /* 管理資料列表 */
    function manageData() {
        $.ajax({
            dataType: 'json',
            url: 'http://192.168.66.222/usergroupAPI/api/getData.php',
            data: { page: page }
        }).done(function (data) {
            totalPage = Math.ceil(data.total / 10);
            currentPage = page;

            $('#pagination').twbsPagination({
                totalPages: totalPage,
                visiblePages: currentPage,
                onPageClick: function (event, pageL) {
                    page = pageL;
                    if (isAjaxFire != 0) {
                        getPageData();
                    }
                }
            });

            manageRow(data.data);
            isAjaxFire = 1;
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
            rows = rows + '<td>' + value.rule + '</td>';
            rows = rows + '<td data-id="' + value.id + '">';
            rows = rows + '<button data-toggle="modal" data-target="#editItem" class="btn btn-primary editItem">Edit</button> ';
            rows = rows + '<button class="btn btn-danger removeItem">Delete</button>';
            rows = rows + '</td>';
            rows = rows + '</tr>';
        });
        $("tbody").html(rows);
    }

    /* 新增資料: 按下送出按鈕 */
    $(".crudSubmit").click(function (e) {
        e.preventDefault();
        var form_action = $("#createItem").find("form").attr("action");
        var name = $("#createItem").find("input[name='name']").val();
        var description = $("#createItem").find("input[name='description']").val();
        var status = $("#createItem").find("input[name='status']").val();
        //var rule_type = $("#createItem").find("input[name='rule_type']").val();
        var rule = JSON.stringify($builderElem.nrecoConditionBuilder('getConditions'));

        var builderConditionsState = $builderElem.nrecoConditionBuilder('getConditions');
        var exprState = $builderElem.nrecoConditionBuilder('getExpression');
        var sqlCondition = buildSqlCondition(builderConditionsState, exprState, ['join_time']);
        var sqlCommand = "select id from db_summary.member_action_stats where id>1000 and " + sqlCondition;

        if (name != '' && rule != '') {
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: 'http://192.168.66.222/usergroupAPI/' + form_action,
                data: { name: name, description: description, status: status, rule: sqlCommand, sql_command: sqlCommand }
            }).done(function (data) {
                $("#createItem").find("input[name='name']").val('');
                $("#createItem").find("input[name='description']").val('');
                $("#createItem").find("input[name='status']").val('');
                //$("#createItem").find("input[name='rule_type']").val('');
                getPageData();
                $(".modal").modal('hide');
                toastr.success('新增成功', '提示', { timeOut: 2000 });
            });
        } else {
            alert('請確認資料都填好了');
        }
    });

    /* 刪除一筆資料 */
    $("body").on("click", ".removeItem", function () {
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
    $("body").on("click", ".editItem", function () {
        var id = $(this).parent("td").data('id');
        var name = $(this).parent("td").prev("td").prev("td").prev("td").prev("td").text();
        var description = $(this).parent("td").prev("td").prev("td").prev("td").text();
        var status = $(this).parent("td").prev("td").prev("td").text();
        //var rule_type = $(this).parent("td").prev("td").prev("td").text();
        //var rule = $(this).parent("td").prev("td").text();

        $("#editItem").find("input[name='name']").val(name);
        $("#editItem").find("input[name='description']").val(description);
        $("#editItem").find("input[name='status']").val(status);
        //$("#editItem").find("input[name='rule_type']").val(rule_type);
        $("#editItem").find(".editId").val(id);
    });

    /* 編輯用的Query Builder */
    var $queryBuilderEdit = $('#queryBuilder'); //div
    $queryBuilderEdit.nrecoConditionBuilder({
        fields: [
            composeFieldDescriptor('total_payment_amount', '總儲值金額', 'integer'),
            composeFieldDescriptor('join_time', '加入日期', 'date'),
            composeFieldDescriptor('first_payment_amount', '首儲金額', 'integer'),
            composeFieldDescriptor('total_rent_paid_amount', '租48小時付費書籍花費點券', 'integer'),
            composeFieldDescriptor('total_buy_paid_amount', '永久購買付費書籍花費點券', 'integer'),
            composeFieldDescriptor('total_upgrade_amount', '升級書籍花費點券', 'integer'),
            composeFieldDescriptor('total_bonus_event', '所有活動贈點', 'integer'),
            composeFieldDescriptor('total_spend', '總消費點券', 'integer'),
        ]
    });

    /* 預先計算總筆數 */
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
    $(".crudSubmitEdit").click(function (e) {

        e.preventDefault();
        var form_action = $("#editItem").find("form").attr("action");
        var name = $("#editItem").find("input[name='name']").val();
        var description = $("#editItem").find("input[name='description']").val();
        var status = $("#editItem").find("input[name='status']").val();
        //var rule_type = $("#editItem").find("input[name='rule_type']").val();
        var id = $("#editItem").find(".editId").val();

        var builderConditionsStateUpdate = $queryBuilderEdit.nrecoConditionBuilder('getConditions');
        var exprStateUpdate = $queryBuilderEdit.nrecoConditionBuilder('getExpression');
        var sqlConditionUpdate = buildSqlCondition(builderConditionsStateUpdate, exprStateUpdate, ['join_time']);
        var sqlCommandUpdate = "select id from db_summary.member_action_stats where id>1000 and " + sqlConditionUpdate;

        if (name != '' && sqlCommandUpdate != '') {
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: 'http://192.168.66.222/usergroupAPI/' + form_action,
                data: { name: name, description: description, status: status, rule: sqlCommandUpdate, sql_command: sqlCommandUpdate, id: id }
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