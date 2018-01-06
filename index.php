<!DOCTYPE html>
<html>
<head>
    <title>會員群組設定</title>
    <link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link href="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="src/queryBuilder.css">
    <link href="//cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.3.0/css/datepicker.css" rel="stylesheet" />

    <style type="text/css">
        .modal-dialog, .modal-content{
    z-index:1051;
    }
    </style>
</head>
<body>
<div class="container">
    <div class="row">
        <div class="col-lg-12 margin-tb">					
            <div class="pull-left">
                <h2>會員群組設定</h2>
            </div>
            <div class="pull-right">
                <button type="button" class="btn btn-success" data-toggle="modal" data-target="#createItem">
                    新增規則
                </button>
            </div>
        </div>
    </div>

    <div class="panel panel-primary">
        <div class="panel-heading">規則管理</div>
            <div class="panel-body">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                        <th>名稱</th>
                        <th>描述</th>
                        <th>啟用</th>
                        <th>規則</th>
                        <th width="200px">動作</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
                <ul id="pagination" class="pagination-sm"></ul>
            </div>
        </div>
    </div>
      <!-- 新增規則彈出視窗 -->
    <div class="modal fade" id="createItem" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" >
        <div class="modal-dialog" role="document">
            <div class="modal-content" style="width:800px;">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                    <h4 class="modal-title" id="myModalLabel">新增規則</h4>
                </div>
                <div class="modal-body">
                    <form data-toggle="validator" action="api/create.php" method="POST">
                        <div class="form-group">
                            <label class="control-label" for="name">名稱</label>
                            <input type="text" name="name" class="form-control" data-error="Please enter name." required />
                            <div class="help-block with-errors"></div>
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="name">描述</label>
                            <input type="text" name="description" class="form-control" data-error="Please enter description." required />
                            <div class="help-block with-errors"></div>
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="name">啟用</label>
                            <h6><small>輸入參數 0:未啟用   1:啟用</small></h6>
                            <input type="text" name="status" class="form-control" data-error="Please enter status." required />
                            <div class="help-block with-errors"></div>
                        </div>
                        <!--
                        <div class="form-group">
                            <label class="control-label" for="name">規則型態</label>
                            <h6><small>輸入參數 0:JSON   1:SQL   2:ID列表</small></h6>
                            <input type="text" name="rule_type" class="form-control" data-error="Please enter rule_type." required />
                            <div class="help-block with-errors"></div>
                        </div>
                        -->

                        <div class="form-group">
                            <label class="control-label" for="name">規則</label>
                            <h6><small>先設定每個條件後，如果再點選一次特定條件的下拉選單「---請選擇---」，將可移除該條件</small></h6>
                            <div id="dataQueryBuilder"></div>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn crudSubmit btn-success">送出</button>
                        </div>
                    </form>
                </div>
                <hr>
                <div class="modal-body">
                    <form class="form-group">
                        <a href="javascript:;" class="btn btn-info queryGetStateSql" style="margin-bottom:10px;">預先計算總筆數</a>
                    </form>
                    <div id="result"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- 編輯規則彈出視窗 -->
    <div class="modal fade" id="editItem" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog" role="document">
            <div class="modal-content" style="width:800px;">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                    <h4 class="modal-title" id="myModalLabel">編輯規則</h4>
                </div>

                <div class="modal-body">
                    <form data-toggle="validator" action="api/update.php" method="put">
                        <input type="hidden" name="id" class="editId">
                        <div class="form-group">
                            <label class="control-label" for="name">名稱</label>
                            <input type="text" name="name" class="form-control" data-error="Please enter name." required />
                            <div class="help-block with-errors"></div>
                        </div>

                         <div class="form-group">
                            <label class="control-label" for="name">描述</label>
                            <input type="text" name="description" class="form-control" data-error="Please enter description." required />
                            <div class="help-block with-errors"></div>
                        </div>
                        
                        <div class="form-group">
                            <label class="control-label" for="name">啟用</label>
                            <h6><small>輸入參數 0:未啟用   1:啟用</small></h6>
                            <input type="text" name="status" class="form-control" data-error="Please enter status." required />
                            <div class="help-block with-errors"></div>
                        </div>
                        <!--
                        <div class="form-group">
                            <label class="control-label" for="name">規則型態</label>
                            <h6><small>輸入參數 0:JSON   1:SQL   2:ID列表</small></h6>
                            <input type="text" name="rule_type" class="form-control" data-error="Please enter rule_type." required />
                            <div class="help-block with-errors"></div>
                        </div>
                        -->

                        <div class="form-group">
                            <label class="control-label" for="name">規則:</label>
                            <h6><small>先設定每個條件後，如果再點選一次特定條件的下拉選單「---請選擇---」，將可移除該條件</small></h6>
                            <div id="queryBuilder"></div>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-success crudSubmitEdit">送出</button>
                        </div>
                    </form>
                </div>

                <hr>
                <div class="modal-body">
                    <form class="form-group">
                        <a href="javascript:;" class="btn btn-info queryGetStateSqlEdit" style="margin-bottom:10px;">預先計算總筆數</a>
                    </form>
                    <div id="resultEdit"></div>
                </div>

            </div>
        </div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-alpha/js/bootstrap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twbs-pagination/1.3.1/jquery.twbsPagination.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/1000hz-bootstrap-validator/0.11.5/validator.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js"></script>
<script src="http://momentjs.com/downloads/moment.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.3.0/js/bootstrap-datepicker.js"></script>
<script src="src/ajaxCRUD.js"></script>
<script src="src/jquery.nrecoconditionbuilder-1.0.js"></script>

</body>
</html>