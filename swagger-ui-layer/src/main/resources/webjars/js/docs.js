$.views.settings.allowCode(true);
$.views.converters("getResponseModelName", function(val) {
    return getResponseModelName(val);
});

var tempBody = $.templates('#temp_body');
var tempBodyResponseModel = $.templates('#temp_body_response_model');
var childrenTable = $.templates('#children-table');

//获取context path
var contextPath = getContextPath();
function getContextPath() {
    var pathName = document.location.pathname;
    var index = pathName.substr(1).indexOf("/");
    var result = pathName.substr(0,index+1);
    return result;
}

$(function(){
    $.ajax({
        // url : "v2/api-docs",
        url : "data.json",
// 	        url : "http://petstore.swagger.io/v2/swagger.json",
        dataType : "json",
        type : "get",
        async : false,
        success : function(data) {
            //layui init
            layui.use([ 'layer','jquery', 'element' ], function() {
                var $ = layui.jquery, layer = layui.layer, element = layui.element;
            });
            var jsonData = eval(data);

            $("#title").html(jsonData.info.title);
            $("body").html($("#template").render(jsonData));

            $("[name='a_path']").click(function(){
                var path = $(this).attr("path");
                var method = $(this).attr("method");
                var operationId = $(this).attr("operationId");
                $.each(jsonData.paths[path],function(i,d){
                    if(d.operationId == operationId){
                        d.path = path;
                        d.method = method;
                        $("#path-body").html(tempBody.render(d));
                        var modelName = getResponseModelName(d.responses["200"]["schema"]["$ref"]);
                        if(modelName){
                            var model = jsonData.definitions[modelName];
                            $("#path-body-response-model").html(tempBodyResponseModel.render(model));
                            $("#path-body-response-model tr").each(function (i) {
                                var $this = $(this);
                                var prop = $this.find("td").eq(1).text();
                                var items = model.properties[prop].items;
                                if(items){
                                    $this.addClass("has-children");
                                }
                            });
                            $("#path-body-response-model tr").on("click",function () {
                                var $this = $(this);
                                var prop = $this.find("td").eq(1).text();
                                var items = model.properties[prop].items;
                                if(items&&(modelName = getResponseModelName(items.$ref))){
                                    if(this._after){
                                        this._after.remove();
                                        this._after = null;
                                        $this.removeClass("active");
                                    }else{
                                        this._after = $(childrenTable.render(jsonData.definitions[modelName]));
                                        this._after.addClass("children");
                                        $this.after(this._after);
                                        $this.addClass("active");
                                    }
                                }
                            });
                        }
                    }
                });
            });

            //提交测试按钮
            $("[name='btn_submit']").click(function(){
                var operationId = $(this).attr("operationId");
                var parameterJson = {};
                $("input[operationId='"+operationId+"']").each(function(index, domEle){
                    var k = $(domEle).attr("name");
                    var v = $(domEle).val();
                    parameterJson.push({k:v});
                });
            });
        }
    });

});


function getResponseModelName(val){
    if(!val){
        return null;
    }
    return val.substring(val.lastIndexOf("/")+1,val.length);
}

//测试按钮，获取数据
function getData(operationId){
    var path = contextPath + $("[m_operationId='"+operationId+"']").attr("path");
    //path 参数
    $("[p_operationId='"+operationId+"'][in='path']").each(function(index, domEle){
        var k = $(domEle).attr("name");
        var v = $(domEle).val();
        if(v){
            path = path.replace("{"+k+"}",v);
        }
    });

    //header参数
    var headerJson = {};
    $("[p_operationId='"+operationId+"'][in='header']").each(function(index, domEle){
        var k = $(domEle).attr("name");
        var v = $(domEle).val();
        if(v){
            headerJson[k] = v;
        }
    });

    //请求方式
    var parameterType = $("#content_type_"+operationId).val();

    //query 参数
    var parameterJson = {};
    if("form" == parameterType){
        $("[p_operationId='"+operationId+"'][in='query']").each(function(index, domEle){
            var k = $(domEle).attr("name");
            var v = $(domEle).val();
            if(v){
                parameterJson[k] = v;
            }
        });
    }else if("json" == parameterType){
        var str = $("#text_tp_"+operationId).val();
        try{
            parameterJson = JSON.parse(str);
        }catch(error){
            layer.msg(""+error,{icon:5});
            return false;
        }
    }

    //发送请求
    $.ajax({
        type: $("[m_operationId='"+operationId+"']").attr("method"),
        url: path,
        headers: headerJson,
        data: parameterJson,
        dataType: 'json',
        success: function(data){
            var options = {
                withQuotes: true
            };
            $("#json-response").jsonViewer(data, options);
        }
    });
}


//请求类型
function changeParameterType(el){
    var operationId = $(el).attr("operationId");
    var type = $(el).attr("type");
    $("#content_type_"+operationId).val(type);
    $(el).addClass("layui-btn-normal").removeClass("layui-btn-primary");
    if("form" == type){
        $("#text_tp_"+operationId).hide();
        $("#table_tp_"+operationId).show();
        $("#pt_json_"+operationId).addClass("layui-btn-primary").removeClass("layui-btn-normal");
    }else if("json" == type){
        $("#text_tp_"+operationId).show();
        $("#table_tp_"+operationId).hide();
        $("#pt_form_"+operationId).addClass("layui-btn-primary").removeClass("layui-btn-normal");
    }
}
