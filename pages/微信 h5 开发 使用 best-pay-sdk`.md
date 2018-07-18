# 前言
说实话最近才接了点项目.项目里面需要使用微信支付进行付款.然后我遇到不少问题.这里总结下.

# 为什么使用best-pay-sdk?
额..看到微信官方的头就痛了.不想看了.微信搞了一套又一套.太麻烦,然后发现这个第三方的sdk.最终确实可以使用了.

# 第三方sdk的Github地址
* [项目地址](https://github.com/Pay-Group/best-pay-sdk)
* [sdk官方demo](https://github.com/Pay-Group/best-pay-demo)
* [自己的项目地址,说实话写的不好我](https://github.com/egdw/ApartmentClean)

#  如何使用
# 要求
需要在Jdk版本>1.8上运行.不满足的请自行绕道.
# 导入maven依赖
```
<dependency>
    <groupId>cn.springboot</groupId>
    <artifactId>best-pay-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```
# 配置
![添加配置文件](https://upload-images.jianshu.io/upload_images/9127053-1ee59b64983ae52f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![配置信息如上](https://upload-images.jianshu.io/upload_images/9127053-8e1998fc9f5caa36.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里介绍一下参数都是代表什么意思
* mpAppId : appid(在微信公众平台查看)
* mchId:商户号(在微信支付平台查看)
* mchKey:密匙(在微信支付平台自行设置,要求32位.建议使用随机密码)
* keyPath:退款密匙(应该这么叫吧.需要去微信支付平台下载.指定密匙的绝对地址)
* notifyUrl:微信支付完成的通知地址

# 前期代码编写
> 注意.大部分的代码请参照官方的demo.比如如何从配置文件数据到类中就不用我说了.

![前期配置类](https://upload-images.jianshu.io/upload_images/9127053-434030a0732fab8c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

*[ PayConfig.java sdk前期初始化](https://github.com/Pay-Group/best-pay-demo/blob/master/src/main/java/com/github/lly835/config/PayConfig.java)
* [WechatAccountConfig.java 从配置文件读取数据](https://github.com/Pay-Group/best-pay-demo/blob/master/src/main/java/com/github/lly835/config/WechatAccountConfig.java "WechatAccountConfig.java")

***************以上的代码实际上不用修改啥********************************
# 支付代码编写
> 注意这里是关键
先看我的代码,可能比较复杂一些.
``` java
/**
 * 支付相关
 *
 * @version 1.0 2017/3/2
 * @auther <a href="mailto:lly835@163.com">廖师兄</a>
 * @since 1.0
 * 不需要进行过滤
 */
@Controller
@Slf4j
public class PayController {

    @Autowired
    private BestPayServiceImpl bestPayService;

    @Autowired
    private OrderDao orderDao;
    @Autowired
    private OrderService orderService;
    @Autowired
    private AddMoneyDao addMoneyDao;
    @Autowired
    private AddMoneyService addMoneyService;
    @Autowired
    private UserDao userDao;
    @Autowired
    private AddMoneyComboDao addMoneyComboDao;

    /**
     * 发起支付
     *
     * @param orderid    订单id
     * @param addmoneyid 充值订单
     */
    @RequestMapping(value = "/pay", method = RequestMethod.GET)
    public ModelAndView pay(
            Map<String, Object> map, HttpSession session, @RequestParam(required = false) String orderid, @RequestParam(required = false) String addmoneyid) {
        User user = (User) session.getAttribute(Constants.CURRENTUSER);
//        User user = userDao.findOne("4028fb82647f166d01647f167cbe0000");
        log.info("请求订单:获取到的订单id为:" + orderid);
        log.info("请求订单:获取到的充值id为:" + addmoneyid);
        if (orderid == null && addmoneyid == null) {
            //不能出现两个参数同时不存在
            return new ModelAndView("wxpay/error", map);
        }
        if (orderid != null && addmoneyid != null) {
            //不能出现两个参数同时存在
            return new ModelAndView("wxpay/error", map);
        }
        PayResponse payResponse = null;
        if (orderid != null) {
            payResponse = handlerOrder(orderid, user);
        } else if (addmoneyid != null) {
            payResponse = handlerAddMoney(addmoneyid, user);
        } else {
            return new ModelAndView("wxpay/error", map);
        }

        map.put("payResponse", payResponse);
        log.info("放入的payResponse对象为:" + payResponse);
        if (payResponse == null) {
            return new ModelAndView("wxpay/error", map);
        }
        return new ModelAndView("wxpay/index", map);
    }

    /**
     * 异步回调
     */
    @RequestMapping(value = "/notify", method = RequestMethod.POST)
    public ModelAndView notify(@RequestBody String notifyData) throws Exception {
        Order order = null;
        AddMoney addMoney = null;
        try {
            log.info("【异步回调】request={}", notifyData);
            PayResponse response = bestPayService.asyncNotify(notifyData);
            log.info("【异步回调】response={}", JsonUtil.toJson(response));

            String orderId = response.getOrderId();

            order = orderDao.findOne(orderId);
            addMoney = addMoneyDao.findOne(orderId);
            if (order != null && addMoney != null) {
                //那就很尴尬了- -.还是退款吧.我可以去买彩票了.
                log.info("普通订单和充值订单uuid居然相同了..." + response);
                orderService.moneyback(orderId);
                addMoneyService.moneyBack(orderId);
            } else {
                if (order != null && !order.isIsmoneyback()) {
                    BigDecimal bigDecimal = new BigDecimal(order.getNeedpay());
                    BigDecimal subtract = bigDecimal.subtract(new BigDecimal(String.valueOf(response.getOrderAmount()))).abs();
                    if (subtract.doubleValue() < 0.01) {
                        log.info("普通订单完成" + order);
                        order.setPayd(true);
                        order.setCompletedate(new Date());
                        try {
                            orderService.setPay(order);
                        } catch (Exception e) {
                            log.warn(e.getMessage() + " " + order + " 出现支付异常.进行退款");
                        }
                        //说明订单支付成功了
                    } else {
                        orderService.moneyback(orderId);
                    }
                } else {
                    //判断addmoney不等于null 并且不是已经退款的订单
                    if (addMoney != null && !addMoney.isIsbackmoney()){
                        BigDecimal bigDecimal = new BigDecimal(addMoney.getMoney());
                        BigDecimal subtract = bigDecimal.subtract(new BigDecimal(String.valueOf(response.getOrderAmount()))).abs();
                        if (subtract.doubleValue() < 0.01) {
                            if (!addMoney.isComplete()) {
                                log.info("充值订单完成" + addMoney);
                                addMoney.setComplete(true);
                                addMoney.setCompletedate(new Date());
                                addMoneyService.setcomplete(addMoney);
                            }
                            //说明订单支付成功了
                        } else {
                            addMoneyService.moneyBack(orderId);
                        }
                    }

                }
            }
        } catch (Exception e) {
            if (order != null) {
                orderService.moneyback(order.getId());
            } else if (addMoney != null) {
                addMoneyService.moneyBack(addMoney.getId());
            }
        }

        return new ModelAndView("wxpay/success");
    }


    /**
     * 处理订单付款请求
     *
     * @param orderid
     * @param user
     * @return
     */
    private PayResponse handlerOrder(String orderid, User user) {
        if (user != null) {
            Order order = orderDao.findOne(orderid);
            if (order == null || order.isPayd() || order.isIssend()) {
                log.debug("没有找到订单");
                return null;
            }
            log.debug("获取到的订单为:" + order);
            PayRequest request = new PayRequest();

            //支付请求参数
            request.setPayTypeEnum(BestPayTypeEnum.WXPAY_H5);
            request.setOrderId(order.getId());
            //把String类型进行转换
            request.setOrderAmount(new BigDecimal(order.getNeedpay()).doubleValue());
            request.setOrderName(order.getOwnercleaner().getName() + order.getOrderyype());
            log.info("当前支付的用户为:" + user);
            request.setOpenid(user.getOpenid());
            log.info("【发起支付】request={}", JsonUtil.toJson(request));

            PayResponse payResponse = bestPayService.pay(request);
            log.info("【发起支付】response={}", JsonUtil.toJson(payResponse));
            return payResponse;
        } else {
            return null;
        }

    }

    private PayResponse handlerAddMoney(String addmoneyid, User user) {
        if (user != null) {
            AddMoney addMoney = addMoneyDao.findOne(addmoneyid);
            log.info("查询出的充值类为:" + addMoney);
            if (addMoney == null || addMoney.isComplete()) return null;
            String machineid = addMoney.getMachineid();
            List<Order> machineidEquals = orderDao.findOrderByMachineid(machineid);
            log.info("查出的机器类为;" + machineidEquals);
            if (machineidEquals == null || machineidEquals.size() == 0) {
                return null;
            }
            boolean issend = machineidEquals.get(0).isIssend();
            //判断租借机器是否已经发出.如果已经发货才能够开始进行充值
            if (!issend) {
                //说明还没有发货.
                return null;
            }
            PayRequest request = new PayRequest();

            //支付请求参数
            request.setPayTypeEnum(BestPayTypeEnum.WXPAY_H5);
            request.setOrderId(addMoney.getId());
            //把String类型进行转换
            request.setOrderAmount(new BigDecimal(addMoney.getMoney()).doubleValue());
            request.setOrderName(addMoney.getMachineid() + " 充值" + addMoney.getCombodesc());
            request.setOpenid(user.getOpenid());
            log.info("【发起支付】request={}", JsonUtil.toJson(request));

            PayResponse payResponse = bestPayService.pay(request);
            log.info("【发起支付】response={}", JsonUtil.toJson(payResponse));
            return payResponse;
        }
        return null;
    }

    @RequestMapping(value = "success.do", method = RequestMethod.GET)
    public String success() {
        return "wxpay/success";
    }

    @RequestMapping(value = "error.do", method = RequestMethod.GET)
    public String error() {
        return "wxpay/error";
    }
}

```
我们在看一下官方的代码,我的代码里残渣了太多自己的东西了.但是官方的代码又简略了一些.我又加了一些注释
 ```java
 @Autowired
    private BestPayServiceImpl bestPayService;

    /**
     * 发起支付
     */
    @GetMapping(value = "/pay")
    public ModelAndView pay(@RequestParam("openid") String openid,
                            Map<String, Object> map) {
        PayRequest request = new PayRequest();
        Random random = new Random();

        //支付请求参数
        request.setPayTypeEnum(BestPayTypeEnum.WXPAY_H5);
        //这里你需要你的唯一的订单号
        request.setOrderId(String.valueOf(random.nextInt(1000000000)));
        //支付的金额
        request.setOrderAmount(0.01);
        //商品的名称
        request.setOrderName("最好的支付sdk");
        //h5获取用户登录信息中获取到openid
        request.setOpenid(openid);
        log.info("【发起支付】request={}", JsonUtil.toJson(request));

        PayResponse payResponse = bestPayService.pay(request);
        log.info("【发起支付】response={}", JsonUtil.toJson(payResponse));

        map.put("payResponse", payResponse);

        return new ModelAndView("pay/create", map);
    }

    /**
     * 异步回调
     */
    @PostMapping(value = "/notify")
    public ModelAndView notify(@RequestBody String notifyData) throws Exception {
        log.info("【异步回调】request={}", notifyData);
        PayResponse response = bestPayService.asyncNotify(notifyData);
        log.info("【异步回调】response={}", JsonUtil.toJson(response));

        return new ModelAndView("pay/success");
    }

```
创建订单时候首先你需要先调用pay这个函数.然后支付成功之后会调用notify这个函数.然后根据需要判断订单是否完成.

细心的同学会发现代码返回到了一个视图pay/create.这里是需要调用微信的接口的.我们看官方的ftl文件是怎么样的.

在这里.我们其实不需要修改代码.这里的参数传入的都是第三方的best-pay-sdk生成好的.我们不需要关心细节.
```
<script>
    function onBridgeReady(){
        WeixinJSBridge.invoke(
                'getBrandWCPayRequest', {
                    "appId":"${payResponse.appId}",     //公众号名称，由商户传入
                    "timeStamp":"${payResponse.timeStamp}",         //时间戳，自1970年以来的秒数
                    "nonceStr":"${payResponse.nonceStr}", //随机串
                    "package":"${payResponse.packAge}",
                    "signType":"MD5",         //微信签名方式：
                    "paySign":"${payResponse.paySign}" //微信签名
                },
                function(res){
                    if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                        alert('支付成功');
                    }else if(res.err_msg == "get_brand_wcpay_request:cancel") {
                        alert('支付过程中用户取消');
                    }else if(res.err_msg == "get_brand_wcpay_request:fail") {
                        alert('支付失败');
                    }else {
                        alert('未知异常');
                    }
                }
        );
    }
    if (typeof WeixinJSBridge == "undefined"){
        if( document.addEventListener ){
            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        }else if (document.attachEvent){
            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
        }
    }else{
        onBridgeReady();
    }
</script>
```
顺便附带一份我写的thymelaf的页面代码.效果和上面一样
```
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<script th:inline="javascript">
    /*<![CDATA[*/
    function onBridgeReady() {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', {
                "appId": [[${payResponse.appId}]],     //公众号名称，由商户传入
                "timeStamp": [[${payResponse.timeStamp}]],         //时间戳，自1970年以来的秒数
                "nonceStr": [[${payResponse.nonceStr}]], //随机串
                "package": [[${payResponse.packAge}]],
                "signType": "MD5",         //微信签名方式：
                "paySign": [[${payResponse.paySign}]] //微信签名
            },
            function (res) {
                if (res.err_msg == "get_brand_wcpay_request:ok") {
                    // alert('支付成功');
                    window.location.href = "/ac/success.do";
                } else if (res.err_msg == "get_brand_wcpay_request:cancel") {
                    window.location.href = "/ac/buydetails.so";
                } else if (res.err_msg == "get_brand_wcpay_request:fail") {
                    window.location.href = "/ac/error.do";
                } else {
                    alert('未知异常');
                }
            }
        );
    }

    if (typeof WeixinJSBridge == "undefined") {
        if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
        }
    } else {
        onBridgeReady();
    }
    /*]]>*/
</script>
</html>
```

到这里.通过判断就可以知道订单是否支付完成了.有兴趣的仔细看看我上面的我打的代码.我这里有两种支付.一种是普通订单支付.一种是续费充值订单.所以我写了一些判断.

# 退款操作
> 退款操作时需要确定自己的退款秘钥是不是已经下载好了.并且配置完成了.否则会有异常.

官方退款代码:
```
 @Autowired
 private BestPayServiceImpl bestPayService;
//就这么几句
RefundRequest refundRequest = new RefundRequest();
//这里传入唯一的订单号
            refundRequest.setOrderId(addMoney.getId());
            refundRequest.setOrderAmount(new BigDecimal(addMoney.getMoney()).doubleValue());
            refundRequest.setPayTypeEnum(BestPayTypeEnum.WXPAY_H5);
            log.info("【微信退款】request={}", JsonUtil.toJson(refundRequest));
            RefundResponse refundResponse = bestPayService.refund(refundRequest);
            log.info("[微信退款]" + refundResponse);
```
我的退款代码:
尤其需要注意安全问题.不能万一已经退了款某个商品数据库还是正常显示这样子...
```
 @Transactional
    public AddMoney moneyBack(String addmoneyid) {
        AddMoney addMoney = addMoneyDao.findOne(addmoneyid);
        if (addMoney == null) {
            return null;
        }
        if (addMoney.isComplete()) {
            //撤销付款记录
            addMoney.setComplete(false);
            //设置成已经退款
            addMoney.setIsbackmoney(true);
//                addMoney.setCompletedate(null);
            //获取充值订单完成时候的日期
            Date completedate = addMoney.getCompletedate();
            //获取机器码
            String machineid = addMoney.getMachineid();
            LeaseMachine leaseMachine = leaseMachineDao.findByMachineid(machineid);
            if (leaseMachine == null) {
                //机器已经不存在了.不能进行退款
                throw new RuntimeException("退款失败.机器不存在");
            }
            Calendar calendar = Calendar.getInstance();
            //获取到过期的时间
            Date date = leaseMachine.getExpirationtime();
            if (date != null && date.getTime() < System.currentTimeMillis()) {
                //如果现在的时间已经超过了过期的时间的话.就不能退款了.他已经把钱都用掉了.
                return null;
            }
            if (date != null) {
                calendar.setTime(date);
                //退款之后减去相应的天数
                calendar.add(Calendar.MONTH, (0 - Math.abs(addMoney.getPaymonth())));
                Date calendarTime = calendar.getTime();
                leaseMachine.setExpirationtime(calendarTime);
                leaseMachineDao.save(leaseMachine);
            }
//            leaseMachine.setExpirationtime();

            //撤销订单.
            AddMoney money = addMoneyDao.save(addMoney);
            //只有已经支付的人才能够退款
            RefundRequest refundRequest = new RefundRequest();
            refundRequest.setOrderId(addMoney.getId());
            refundRequest.setOrderAmount(new BigDecimal(addMoney.getMoney()).doubleValue());
            refundRequest.setPayTypeEnum(BestPayTypeEnum.WXPAY_H5);
            log.info("【微信退款】request={}", JsonUtil.toJson(refundRequest));
            RefundResponse refundResponse = bestPayService.refund(refundRequest);
            log.info("[微信退款]" + refundResponse);
            if (refundResponse == null) {
                throw new RuntimeException("退款出现问题");
            }
            return money;

        }
        return null;
    }
```

# 总结
> 涉及钱的一定要小心 涉及钱的一定要小心 涉及钱的一定要小心
> 考虑考虑并发会不会有问题

文章作者:恶搞大王