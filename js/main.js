var vm = new Vue({
    el: '#test',
    methods: {
        testfun: function () {
            alert("事件触发了")
            $.ajax({
                type: "get",
                url: "https://api.github.com/repos/egdw/temp_pic_upload",
                dataType: "json",
                success: function (data, response) {
                    console.log(response)
                    console.log(data)
                }
            });
        }
    },
    data: {
        test: 'test'
    }
})