    function Chess(options) {
        this._initGame(options);
    }
    Array.prototype.hasChess = function (id,x,y) {
        for(let i = 0;i<this.length;i++){
            if(this[i].id != id && this[i].x == x && this[i].y == y){
                return true;
            }
        }
        return false;
    }

    Array.prototype.eatEnemies = function (x,y) {
        for(let i = 0;i<this.length;i++){
            if(this[i].x == x && this[i].y == y){
                return this[i].id;
            }
        }
        return "";
    }

    $.extend(Chess.prototype,{
        chessmans : {
            "blue":[],
            "red":[]
        },
        car_1:'', car_2:'', car_3:'', car_4:'', horse_1:'', horse_2:'', horse_3:'', horse_4:'', elephant_1:'', elephant_2:'', elephant_3:'',
        elephant_4:'', knight_1:'', knight_2:'', knight_3:'', knight_4:'', boss_1:'', boss_2:'', gun_1:'', gun_2:'', gun_3:'', gun_4:'',
        soldier_1:'', soldier_2:'', soldier_3:'', soldier_4:'', soldier_5:'', soldier_6:'', soldier_7:'',soldier_8:'', soldier_9:'', soldier_10:'',
        isUp:false,
        $curr:null,
        socket:null,
        myId : '',
        curr_role :'',
        canChess : false,
        room:{},
        _initGame:function (opt) {
            var _this = this;
            this.options = {
                game_el:opt.game_el,
                canvas_el:opt.canvas_el
            }
            $.extend(true,_this.options,opt||{});

            // canvas绘制棋盘
            this._draw();
            // 初始化棋子内容
            this._initChess();
            // 绘制棋子
            this._drawChess();
            // 初始化DOM事件
            this._initChessDomFun();

            return this;

        },
        getRelativePos:function(chess,x,y) {
            return {
                x:(x-chess.x)/50,
                y:(y-chess.y)/50
            }
        },
        hasChess:function(x,y) {
            var arr = this.chessmans.blue.concat(this.chessmans.red);

            for(var i = 0;i<arr.length;i++){
                if(arr[i].x == x && arr[i].y == y){
                    return true;
                }
            }
            return false;
        },
        countChessBetweenRoute:function(chess,x,y) {
            var count = 0;
            var arr = this.chessmans.blue.concat(this.chessmans.red);
            if(chess.x == x){
                // 判断竖轴
                for(let i = 0 ; i<arr.length; i++){
                    if(arr[i].y<Math.max(chess.y,y) && arr[i].y > Math.min(chess.y,y) && arr[i].x == x){
                        count ++;
                    }
                }

            }else{
                // 判断横轴
                for(let i = 0 ; i<arr.length; i++){
                    if(arr[i].x<Math.max(chess.x,x) && arr[i].x > Math.min(chess.x,x) && arr[i].y == y){
                        count ++;
                    }
                }
            }
            return count;
        },
        getChess:function(dataset){

            var arr = this.chessmans[dataset.role];

            if(arr == undefined || arr == null || arr == ''){
                return "";
            }

            for (let i = 0;i<arr.length; i++){
                if(arr[i].id == dataset.id){
                    return arr[i];
                }
            }

            return "";
        },
        checkBound:function(chess,x,y){
            //判断是红方还是蓝方棋子
            if(chess.role == 'blue' && y > 200){
                return true;
            }
            if(chess.role == 'red' && y < 250){
                return true
            }
            return false
        },
        clearGame:function() {
            $(this.options.game_el).empty();
        },
        rule_base : {

            "horse":function(chess, x, y){
                var _this = this;
                // 获取落点位置
                var pos = _this.getRelativePos(chess,x,y);

                // 如果走法不是按照'日'字格走则返回。
                if(Math.abs(pos.x)/Math.abs(pos.y) != 2 && Math.abs(pos.y)/Math.abs(pos.x) != 2){
                    console.error('马','请按日字格走')
                    return chess;
                }
                // 如果是按'日'字格，但是较长的那一边不能有棋子
                if(_this.hasChess(Math.abs(pos.x)/Math.abs(pos.y) == 2 ? (x+chess.x)/2 : chess.x , Math.abs(pos.x)/Math.abs(pos.y) == 2 ? chess.y : (y+chess.y)/2)){
                    console.error('马','有障碍');
                    return chess;
                }
                // 棋子下落
                return _this.landing(chess,x,y);

            },
            "car":function (chess, x, y) {
                var _this = this;
                // 判断是否是直线
                if(chess.x != x && chess.y != y){
                    console.error('车',"请走直线");
                    return chess;
                }
                console.log(chess,x,y);
                // 移动路线中间不能有其他棋子
                var count = _this.countChessBetweenRoute(chess,x,y);

                if(count != 0){
                    // 中间有棋子 ，走不了
                    console.error('车',"不能跨越棋子")
                    return chess;
                }
                // 中间没有棋子 可以走
                return _this.landing(chess,x,y);

            },
            "soldier":function (chess, x, y) {
                var _this = this;
                // 判断是否合乎规则 未过界时，只能朝一个方向走，过界后，不能往后走
                // 首先判断是否只走了一格

                var pos = _this.getRelativePos(chess, x, y);

                if ((chess.x == x && Math.abs(chess.y - y) / 50 === 1) || (chess.y == y && Math.abs(chess.x - x) / 50 === 1)) {
                    // 只走了一格
                    // 判断当前是都过界
                    if (_this.checkBound(chess, x, y)) {
                        // 过界
                        // 过界了棋子只能"向前、左、右"走一格，不能往后走
                        if (chess.role == 'blue' && (Math.abs(pos.x) > 1 || (Math.abs(pos.x) == 0 && pos.y != 1))) {
                            return chess;
                        }
                        if (chess.role == 'red' && (Math.abs(pos.x) > 1 || (Math.abs(pos.x) == 0 && pos.y != -1))) {
                            return chess;
                        }

                    } else {
                        // 没有过界
                        // 判断是否是只向前走了一格
                        if (chess.role == 'blue' && (Math.abs(pos.x) > 0 || (pos.y != 1 && Math.abs(pos.x) == 0))) {
                            return chess;
                        }
                        if (chess.role == 'red' && (Math.abs(pos.x) > 0 || (pos.y != -1 && Math.abs(pos.x) == 0))) {
                            return chess;
                        }
                    }
                } else {
                    return chess;
                }

                return _this.landing(chess,x,y);
            },
            "gun":function (chess,x,y) {
                var _this = this;
                // 获取落点位置
                var pos = _this.getRelativePos(chess,x,y);
                // 获取中间经过的棋子的数量
                var count = _this.countChessBetweenRoute(chess,x,y);

                // 如果不是直线或者中间棋子数量不是1或者大于1，则返回
                if((Math.abs(pos.x) > 0 && Math.abs(pos.y) > 0) || count > 1){
                    return chess;
                }

                // 如果是跨越某个棋子，落点必须是地方棋子，否则走法无效
                if(count == 1 &&!this.chessmans[chess.role == 'blue'? 'red':'blue'].hasChess(chess.id, x, y)){
                    return chess;
                }

                return _this.landing(chess,x,y);
            },
            "elephant":function (chess,x,y) {
                var _this = this;
                // 获取落点位置
                var pos = _this.getRelativePos(chess,x,y);
                // 获取中间经过的棋子的数量
                var count = _this.countChessBetweenRoute(chess,x,y);

                // 不能过界
                if(chess.role == 'blue' && y > 200){
                    return chess;
                }
                if(chess.role == 'red' && y < 250){
                    return chess;
                }

                // 象的规则
                if(Math.abs(pos.x) != 2 || Math.abs(pos.y) != 2){
                    return chess;
                }
                // 走田字格中间不能有棋子
                if(_this.hasChess((chess.x+x)/2,(chess.y+y)/2)){
                    return chess;
                }

                return _this.landing(chess,x,y);
            },
            "knight":function (chess,x,y) {
                var _this = this;
                // 是否在活动范围内
                if(x<150 || x > 250){
                    return chess;
                }
                var yy = y > 200 ? y - 350: y;
                if(yy < 0 ||yy > 100){
                    return chess;
                }
                var pos = _this.getRelativePos(chess,x,y);
                // 士的规则
                if(Math.abs(pos.x) != 1 || Math.abs(pos.y) !=1){
                    return chess;
                }

                return _this.landing(chess,x,y);
            },
            "boss":function (chess,x,y) {
                var _this = this;
                // 是否在活动范围内
                if(x<150 || x > 250){
                    return chess;
                }
                var yy = y > 200 ? y - 350: y;
                if(yy < 0 ||yy > 100){
                    return chess;
                }
                var pos = _this.getRelativePos(chess,x,y);

                if(pos.x != 0 && pos.y != 0){
                    return chess;
                }
                if((pos.x == 0 && Math.abs(pos.y) > 1) || (pos.y == 0 && Math.abs(pos.x) > 1)){
                    return chess;
                }

                return _this.landing(chess,x,y);

            }
        },
        getIndex(role,id) {

            for(var i=0;i<this.chessmans[role].length;i++){
                if(this.chessmans[role][i].id == id ){
                    return i;
                }
            }
            return -1;
        },
        // 判断胜负
        checkResult:function (role) {
            var arr = this.chessmans[role == 'blue'? 'red':'blue'];
            for(let i = 0;i<arr.length;i++){
                if(arr[i].type == 'boss'){
                    return false;
                }
            }
            return true;
        },
        landing:function(chess,x,y) {
            var _this = this;
            // 判断下落点是否有其他己方棋子
            if (this.chessmans[chess.role].hasChess(chess.id, x, y)) {
                // 有则直接return
                return chess;
            }
            // 判断落点是否是敌对棋子，是的话则吃点对方棋子
            var enemy_id = this.chessmans[chess.role == "blue" ? "red" : "blue"].eatEnemies(x, y)
            if (enemy_id != '') {
                // 将需要移除的棋子信息上传至服务器
                this.socket.emit('eat',{room:_this.room,chess:this.chessmans[chess.role == "blue" ? "red" : "blue"][_this.getIndex(chess.role == "blue" ? "red" : "blue", enemy_id)],id:_this.myId});

                // 移除该棋子
                this.chessmans[chess.role == "blue" ? "red" : "blue"].splice(_this.getIndex(chess.role == "blue" ? "red" : "blue", enemy_id), 1);
                chess.x = x;
                chess.y = y;
                // 清空棋盘
                _this.clearGame();
                // 放置棋子
                _this._drawChess();


                return chess;
            }
            chess.x = x;
            chess.y = y;
            return chess;
        },

        _initChessDomFun:function(){
            var _this = this;
            $(this.options.game_el).on('click',function (ev) {
                if(!_this.canChess){
                    console.log('未轮到自己，请稍后');
                    return ;
                }


                if(_this.isUp){

                    var dataset =  $(ev.target).parent().data();

                    var xx = ev.originalEvent.x || ev.originalEvent.layerX || 0;
                    var yy = ev.originalEvent.y || ev.originalEvent.layerY || 0;
                    var x = xx-document.getElementById('chess').getBoundingClientRect().x;
                    var y = yy-document.getElementById('chess').getBoundingClientRect().y;

                    // 判断是否出界
                    if(x<0 || y < 0 || x > 400 || y > 450 ){
                        // 出界
                        return
                    }

                    // 将xx和yy转为标准的点坐标
                    var x1 = x % 100 ;
                    var x2 = 0;
                    if(x1>25 && x1 < 75){
                        x2 = 50;
                    }
                    if(x1 >= 76 && x1 <100){
                        x2 = 100;
                    }
                    var x = Math.floor(x/100)*100 + x2;

                    var y1 = y % 100 ;

                    var y2 = 0;
                    if(y1>25 && y1 < 75){
                        y2 = 50;
                    }
                    if(y1 >= 76 && y1 <100){
                        y2 = 100;
                    }
                    var y = Math.floor(y/100)*100 + y2;

                    var chess = _this.getChess(dataset);

                    if(chess == ''){
                        return ;
                    }

                    // 验证棋子是否成功落子。即结束本方回合
                    var prev_x = chess.x;
                    var prev_y = chess.y;

                    var new_chess = _this.rule_base[chess.type].call(_this,chess,x,y);

                    _this.$curr.css({
                        "top":new_chess.y,
                        "left":new_chess.x
                    })

                    // new_chess.y = _this.curr_role == 'red'?new_chess.y:450-new_chess.y;

                    // 落子成功，则转变角色，如果没有落子成功，棋子回到原处，不转变角色
                    if(new_chess.x !== prev_x || new_chess.y !== prev_y){

                        _this.canChess = false;

                        // 将信息传至服务器
                        _this.socket.emit('chess', {chess:{
                                                        role:new_chess.role,
                                                        type:new_chess.type,
                                                        text:new_chess.text,
                                                        id:new_chess.id,
                                                        x:new_chess.x,
                                                        y:450-new_chess.y
                                                    },id:_this.myId,room:_this.room},
                            function () {
                                //验证结果
                                if(_this.checkResult(_this.curr_role)){
                                    // 如果则赢了

                                    _this.socket.emit('result',{room:_this.room});

                                    // 重置游戏
                                    _this.isUp=false;
                                    _this.$curr=null;
                                    _this.curr_role='';
                                    _this.canChess =false;

                                    _this._empty();
                                    // 初始化棋子内容
                                    _this._initChess();
                                    // 绘制棋子
                                    _this._drawChess();

                                    alert('you win');

                                    return;
                                }
                        });




                    }

                    _this.$curr.removeClass('high-index');
                    _this.$curr = null
                    _this.isUp = false;
                }else{
                    _this.$curr = $(ev.target).parent()
                    _this.$curr.addClass('high-index');
                    _this.isUp = true;
                }
            })
            $('body').on('mousemove','.chessman',function (ev) {
                //console.log(document.getElementById('chess').getBoundingClientRect());
                if(_this.$curr != null){
                    var xx = ev.originalEvent.x || ev.originalEvent.layerX || 0;
                    var yy = ev.originalEvent.y || ev.originalEvent.layerY || 0;
                    _this.$curr.css({
                        "top":yy-document.getElementById('chess').getBoundingClientRect().y,
                        "left":xx-document.getElementById('chess').getBoundingClientRect().x
                    })
                }
            })
        },
        _draw:function () {

            var gameBg_canvas = document.getElementById(this.options.canvas_el);
            var gamebg_ctx = gameBg_canvas.getContext('2d');
            // 棋盘背景
            gamebg_ctx.fillStyle = '#EEE685';
            gamebg_ctx.fillRect(0,0,410,460);

            // 棋盘边界
            gamebg_ctx.strokeStyle = '#CD3700';
            gamebg_ctx.strokeRect(5,5,400,450);

            // 绘制线条
            for(var i = 0; i < 9; i++){
                // 横线
                gamebg_ctx.strokeStyle = '#CD3700';
                gamebg_ctx.beginPath();
                gamebg_ctx.moveTo(5,i*50+5);
                gamebg_ctx.lineTo(8*50+5,i*50+5);
                gamebg_ctx.stroke();
            }

            for (var i = 0; i< 8;i++){
                // 竖线
                gamebg_ctx.beginPath();
                gamebg_ctx.moveTo(50*i+5,5);
                gamebg_ctx.lineTo(50*i+5,205);
                gamebg_ctx.stroke();

                gamebg_ctx.beginPath();
                gamebg_ctx.moveTo(50*i+5,255);
                gamebg_ctx.lineTo(50*i+5,455);
                gamebg_ctx.stroke();
            }

            // 大本营
            gamebg_ctx.beginPath();
            gamebg_ctx.moveTo(155,5);
            gamebg_ctx.lineTo(255,105);
            gamebg_ctx.stroke();

            gamebg_ctx.beginPath();
            gamebg_ctx.moveTo(255,5);
            gamebg_ctx.lineTo(155,105);
            gamebg_ctx.stroke();

            gamebg_ctx.beginPath();
            gamebg_ctx.moveTo(155,355);
            gamebg_ctx.lineTo(255,455);
            gamebg_ctx.stroke();

            gamebg_ctx.beginPath();
            gamebg_ctx.moveTo(255,355);
            gamebg_ctx.lineTo(155,455);
            gamebg_ctx.stroke();

            // 绘制文字
            gamebg_ctx.fillStyle = '#CD3700';
            gamebg_ctx.font="30px STKaiti";
            gamebg_ctx.fillText("楚河         汉界",110,240);
            gamebg_ctx.rotate(90);
        },
        _initChess:function () {
            this.car_1 = {
                role:'blue',
                type:'car',
                text:'车',
                id:'1',
                x:0,
                y:0,
            }
            this.car_2 = {
                role:'blue',
                type:'car',
                text:'车',
                id:'2',
                x:400,
                y:0,
            }
            this.car_3 = {
                role:'red',
                type:'car',
                text:'車',
                id:'3',
                x:0,
                y:450,
            }
            this.car_4 = {
                role:'red',
                type:'car',
                text:'車',
                id:'5',
                x:400,
                y:450,
            }

            this.horse_1 = {
                role:'blue',
                type:'horse',
                text:'马',
                id:'6',
                x:50,
                y:0,
            }
            this.horse_2 = {
                role:'blue',
                type:'horse',
                text:'马',
                id:'7',
                x:350,
                y:0,
            }
            this.horse_3 = {
                role:'red',
                type:'horse',
                text:'馬',
                id:'8',
                x:50,
                y:450,
            }
            this.horse_4 = {
                role:'red',
                type:'horse',
                text:'馬',
                x:350,
                id:'4',
                y:450,
            }
            this.elephant_1 ={
                role:'blue',
                type:'elephant',
                text:'象',
                id:'9',
                x:100,
                y:0,
            }
            this.elephant_2 ={
                role:'blue',
                type:'elephant',
                text:'象',
                x:300,
                id:'10',
                y:0,
            }
            this.elephant_3 ={
                role:'red',
                type:'elephant',
                text:'相',
                id:'11',
                x:100,
                y:450,
            }
            this.elephant_4 ={
                role:'red',
                type:'elephant',
                text:'相',
                id:'12',
                x:300,
                y:450,
            }
            this.knight_1 ={
                role:'blue',
                type:'knight',
                text:'士',
                id:'32',
                x:150,
                y:0,
            }
            this.knight_2 ={
                role:'blue',
                type:'knight',
                text:'士',
                id:'13',
                x:250,
                y:0,
            }
            this.knight_3 ={
                role:'red',
                type:'knight',
                text:'士',
                id:'14',
                x:150,
                y:450,
            }
            this.knight_4 ={
                role:'red',
                type:'knight',
                text:'士',
                x:250,
                id:'15',
                y:450,
            }
            this.boss_1 = {
                role:'blue',
                type:'boss',
                text:'将',
                id:'16',
                x:200,
                y:0,
            }
            this.boss_2 = {
                role:'red',
                type:'boss',
                text:'帥',
                id:'17',
                x:200,
                y:450,
            }
            this.gun_1 = {

                role:'blue',
                type:'gun',
                text:'炮',
                id:'18',
                x:50,
                y:100
            }
            this.gun_2 = {
                role:'blue',
                type:'gun',
                text:'炮',
                id:'19',
                x:350,
                y:100
            }
            this.gun_3 = {
                role:'red',
                type:'gun',
                text:'炮',
                id:'20',
                x:50,
                y:350
            }
            this.gun_4 = {
                role:'red',
                type:'gun',
                text:'炮',
                id:'21',
                x:350,
                y:350
            }
            this.soldier_1 = {
                role:'blue',
                type:'soldier',
                text:'卒',
                id:'22',
                x:0,
                y:150
            }
            this.soldier_2 = {
                role:'blue',
                type:'soldier',
                text:'卒',
                id:'23',
                x:100,
                y:150
            }
            this.soldier_3 = {
                role:'blue',
                type:'soldier',
                text:'卒',
                id:'24',
                x:200,
                y:150
            }
            this.soldier_4 = {
                role:'blue',
                type:'soldier',
                text:'卒',
                id:'25',
                x:300,
                y:150
            }
            this.soldier_5 = {
                role:'red',
                type:'soldier',
                text:'卒',
                id:'26',
                x:400,
                y:150
            }

            this.soldier_6 = {
                role:'red',
                type:'soldier',
                text:'兵',
                id:'27',
                x:0,
                y:300
            }
            this.soldier_7 = {
                role:'red',
                text:'兵',
                type:'soldier',
                id:'28',
                x:100,
                y:300
            }
            this.soldier_8 = {
                role:'red',
                type:'soldier',
                text:'兵',
                id:'29',
                x:200,
                y:300
            }
            this.soldier_9 = {
                role:'red',
                type:'soldier',
                text:'兵',
                id:'30',
                x:300,
                y:300
            }
            this.soldier_10 = {
                role:'red',
                type:'soldier',
                text:'兵',
                id:'31',
                x:400,
                y:300
            }
            chessmans = {
                "blue":[],
                "red":[]
            };
            this.chessmans.blue = [this.car_1,this.car_2,this.horse_1,this.horse_2,this.elephant_1,this.elephant_2,this.knight_1,this.knight_2,this.boss_1,this.gun_1,this.gun_2,this.soldier_1,this.soldier_2,this.soldier_3,this.soldier_4,this.soldier_5];
            this.chessmans.red = [this.car_3,this.car_4,this.horse_3,this.horse_4,this.elephant_3,this.elephant_4,this.knight_3,this.knight_4,this.boss_2,this.gun_3,this.gun_4,this.soldier_6,this.soldier_7,this.soldier_8,this.soldier_9,this.soldier_10];
        },
        _drawChess:function () {


            for(var i = 0; i < this.chessmans.blue.length; i++){
                $(this.options.game_el).append('<span class="chessman" data-role="blue" data-id=\"'+this.chessmans.blue[i].id+'\"><span>'+this.chessmans.blue[i].text+'</span></span>');

                $(this.options.game_el).children().eq($(this.options.game_el).children().length-1).css({
                    "top":this.chessmans.blue[i].y,
                    "left":this.chessmans.blue[i].x
                });

            }

            for(var i = 0; i < this.chessmans.red.length; i++){
                $(this.options.game_el).append('<span class="chessman chessman1" data-role="red" data-id=\"'+this.chessmans.red[i].id+'\"><span>'+this.chessmans.red[i].text+'</span></span>');

                $(this.options.game_el).children().eq($(this.options.game_el).children().length-1).css({
                    "top":this.chessmans.red[i].y,
                    "left":this.chessmans.red[i].x
                });

            }
        },
        _empty:function () {
            $(this.options.game_el).empty();
        },
        changeQipan:function (role) {

            if(role != 'blue'){
                return;
            }
            $(this.options.game_el).empty();
            var arr = this.chessmans.blue.concat(this.chessmans.red);
            for(var i = 0; i < arr.length; i++){
                arr[i].y = 450-arr[i].y;
            }
            this._drawChess();

        },
        getRooms:function () {
          return this.rooms;
        },

        connetNet:function (url) {
            var _this = this;
            return new Promise(function(resolve, reject){
                _this.socket = io(url);

                if(_this.socket == null || _this.socket == undefined){
                    reject('未连接上');
                }else{
                    resolve(_this.socket);
                }
            });




        }
    })
