// 当前项目的仓库地址
var currentRepositoryUrl;
// 当前项目的配置地址
var currentConfigUrl;
// 当前文章的地址
var currentPageUrl;
// 当前api的地址
var currentApiUrl;
// 真实的地址
var realUrl;


Vue.component("nopicli", {
    template: '<li @click="forwardHandler" class="flow-list-li"><a><div class="summary"><h3 class="title">{{pagetitle}}</h3><p class="abstract">{{mydesc}}</p></div></a><hr/></li>',
    props: ['item', 'download_url','page_title'],
    data: function () {
        return {
            mytitle: '',
            mydesc: '',
        }
    },
    computed: {
        pagetitle: function () {
            console.log(this.item.name)
            temp = this.item.name.split("`")
            if (temp.length >= 1) {
                this.mytitle = temp[0]
                this.mydesc = temp[1]
            } else {
                this.mytitle = temp[0]
            }
            return this.mytitle
        },
    }, methods: {
        forwardHandler: function () {
            window.location.href = "details.html?url=" + this.download_url+"&page_title="+this.mytitle;
        }
    }

})

var vm = new Vue({
    el: '#main',
    methods: {

    },
    data: {
        pages: []
    }
})

$(document).ready(function () {

    // 获取配置文件的地址
    url = window.location.href;
    this.realUrl = url;
    url = url.replace("/index.html", "/")
    if (url.length > 0) {
        if (url.charAt(url.length - 1) == '/') {
            // 如果后面有斜杠的话
            url = url + "assets/config.json";
        } else {
            url = url + "/assets/config.json";
        }
    }
    //获取到当前配置文件的路径
    this.currentConfigUrl = url;
    console.log(url)
    $.ajax({
        type: "get",
        url: url,
        dataType: "json",
        success: function (data, response) {
            blog_title = data.blog_title
            $(document).attr('title', blog_title);
            $("#logo_title").innerText = blog_title;
            //获取到当前项目的url地址
            this.currentRepositoryUrl = data.repository_url
            this.currentApiUrl = data.api_url
            //获取当前项目的文章地址
            this.currentPageUrl = this.currentApiUrl + "/contents/pages?ref=master"
            //进行ajax请求.获取相应的数据
            console.log(this.currentRepositoryUrl)
            console.log(this.currentPageUrl)
            //获取文章..
            $.ajax({
                type: "get",
                url: this.currentPageUrl,
                dataType: "json",
                success: function (data, response) {
                    console.log(data)
                    vm.pages = data;
                    // for (var i = 0; i < data.length; i++) {
                    //     console.log(data[i])
                    // }
                }
            });
        }
    });
});
