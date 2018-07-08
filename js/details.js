var vm = new Vue({
    el: '#main',
    data: {
        message: '',
    }
})

$(document).ready(function () {
    url = getQueryString("url")
    page_title = getQueryString("page_title")
    $(document).attr('title', page_title);
    console.log(url)
    if (url != null) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "text",
            success: function (data, response) {
                html = compileMarkDown(data)
                vm.message = html;
            },
            error: function () {
                sweetAlert(
                    '哎呦……',
                    '出错了！',
                    'error'
                )
            }
        });
    }
});


//获取get传值的方法
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURI(r[2]);
    return null;
}

// 把markdown转换为html代码.通过使用showdown.js
function compileMarkDown(text) {
    //创建实例
    var converter = new showdown.Converter();
    //进行转换
    var html = converter.makeHtml(text);
    //展示到对应的地方
    return html;
}
