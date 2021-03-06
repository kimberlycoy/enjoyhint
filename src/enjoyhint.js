var EnjoyHint = function (_options) {
    var that = this;
    // Some options
    var defaults = {
        hideClose : false
    };
    var options = $.extend(defaults, _options);

    // subscribe, emit events
    that.listeners = [];
    that.on = function (event, listener) {
        that.listeners.push({
            event: event,
            listener: listener
        });
    };
    that.emit = function (event, data) {
        that.listeners.forEach(function (listener) {
            if (new RegExp(listener.event).test(event)) {
                listener.listener(event, that, data);
            }
        });
    }
    if (options.onStart) that.on('start', options.onStart);
    if (options.onEnd) that.on('end', options.onEnd);
    if (options.onSkip) that.on('skip', options.onSkip);


    var data = [];
    var current_step = 0;

    $body = $('body');

    /********************* PRIVAT METHODS ***************************************/
    var init = function () {
        if ($('.enjoyhint'))
            $('.enjoyhint').remove();
        $('body').css({'overflow':'hidden'});
        $(document).on("touchmove",lockTouch);

        $body.enjoyhint({
            onNextClick: function () {
                nextStep();
            },
            onSkipClick: function () {
                skipAll();
            }
        });
    };

    var lockTouch = function(e) {
        e.preventDefault();
    };

    var destroyEnjoy = function () {
        $body = $('body');
        $('.enjoyhint').remove();
        $("body").css({'overflow':'auto'});
        $(document).off("touchmove", lockTouch);

    };

    that.clear = function(){
        //(Remove userClass and set default text)
        $(".enjoyhint_next_btn").removeClass(that.nextUserClass);
        $(".enjoyhint_next_btn").text("Next");
        $(".enjoyhint_skip_btn").removeClass(that.skipUserClass);
        $(".enjoyhint_skip_btn").text("Skip");
    }

    var $body = $('body');

    var stepAction = function () {
        if (data && data[current_step]) {
            $(".enjoyhint").removeClass("enjoyhint-step-"+current_step);
            $(".enjoyhint").addClass("enjoyhint-step-"+(current_step+1));
            var step_data = data[current_step];

            that.emit('step.start', step_data, that);

            if (step_data.onBeforeStart && typeof step_data.onBeforeStart === 'function') {
                step_data.onBeforeStart();
            }
            var timeout = step_data.timeout || 0;
            setTimeout(function () {
                setTimeout(function(){
                    that.clear();
                }, 250);
                $(document.body).scrollTo(step_data.selector, step_data.scrollAnimationSpeed || 250, {offset: -100});
                setTimeout(function () {
                    var $element = step_data.selector ? $(step_data.selector) : $('body');
                    var event = makeEventName(step_data.event);
                    var shape_data = {};

                    $body.enjoyhint('show');
                    $body.enjoyhint('hide_next');
                    var $event_element = $element;
                    if (step_data.event_selector) {
                        $event_element = $(step_data.event_selector);
                    }
                    if (!step_data.event_type && step_data.event == "key"){
                        $element.keydown(function( event ) {
                            if ( event.which == step_data.keyCode ) {
                                current_step++;
                                stepAction();
                            }
                        });
                    }
                    if (step_data.showNext == true){
                        $body.enjoyhint('show_next');
                    }
                    if (step_data.showSkip){
                        $body.enjoyhint('show_skip');
                    }else{
                        $body.enjoyhint('hide_skip');
                    }


                    if (step_data.nextButton){
                        $(".enjoyhint_next_btn").addClass(step_data.nextButton.className || "");
                        $(".enjoyhint_next_btn").text(step_data.nextButton.text || "Next");
                        that.nextUserClass = step_data.nextButton.className
                    }

                    if (step_data.skipButton){
                        $(".enjoyhint_skip_btn").addClass(step_data.skipButton.className || "");
                        $(".enjoyhint_skip_btn").text(step_data.skipButton.text || "Skip");
                        that.skipUserClass = step_data.skipButton.className
                    }

                    if (step_data.autoFill){
                        var selector = step_data.autoFill.selector || step_data.selector;
                        $(selector).val(step_data.autoFill.content);
                    }

                    if (step_data.event_type) {
                        switch (step_data.event_type) {
                            case 'auto':
                                $element[step_data.event]();
                                switch (step_data.event) {
                                    case 'click':
                                        break;
                                }
                                current_step++;
                                stepAction();
                                return;
                                break;
                            case 'custom':
                                on(step_data.event, function () {
                                    current_step++;
                                    off(step_data.event);
                                    stepAction();
                                });
                                break;
                            case 'next':
                                $body.enjoyhint('show_next');
                                break;

                        }

                    } else {
                        if (step_data.event === "click" || step_data.event === "change") {
                            $event_element.on(event, function (e) {
                                $event_element.unbind(event);
                                
                                if (step_data.keyCode && e.keyCode != step_data.keyCode) {
                                    return;
                                }
                                current_step++;
                                $(this).off(event);

                                that.emit('step.next', step_data);
                                stepAction();
                            });
                        } else {
                            $body.on(event, step_data.event_selector || step_data.selector, function (e) {
                                $body.unbind(event);

                                if (step_data.keyCode && e.keyCode != step_data.keyCode) {
                                    return;
                                }
                                current_step++;
                                $(this).off(event);

                                that.emit('step.next', step_data);
                                stepAction();
                            });
                        }
                    }

                    shape_data = {
                        text : step_data.description,
                        width:0,
                        height:0,
                        center_x:0,
                        center_y:0
                    }

                    if (options.hideClose) {
                        shape_data.close_css = {
                            'display': 'none'
                        };
                    }

                    if(step_data.selector){
                        var max_habarites = Math.max($element.outerWidth(), $element.outerHeight());
                        var radius = step_data.radius  || Math.round(max_habarites / 2) + 5;
                        var offset = $element.offset();
                        var w = $element.outerWidth();
                        var h = $element.outerHeight();
                        var shape_margin = (step_data.margin !== undefined) ? step_data.margin : 10;
                        var coords = {
                            x: offset.left + Math.round(w / 2) ,
                            y: offset.top + Math.round(h / 2)  - $(document).scrollTop()
                        };
                        shape_data = {
                            center_x: coords.x,
                            center_y: coords.y,
                            text: step_data.description,
                            top: step_data.top,
                            bottom: step_data.bottom,
                            left: step_data.left,
                            right: step_data.right,
                            margin: step_data.margin,
                            scroll: step_data.scroll,
                        };

                        console.log(shape_data);

                        if (step_data.shape && step_data.shape == 'circle') {
                            shape_data.shape = 'circle';
                            shape_data.radius = radius;
                        } else {
                            shape_data.radius = 0;
                            shape_data.width = w + shape_margin;
                            shape_data.height = h + shape_margin;
                        }
                    }else{
                        shape_data.hideArrow = true
                    }
                        
                    $body.enjoyhint('render_label_with_shape', shape_data);
                    
                }, step_data.scrollAnimationSpeed + 20 || 270);
            }, timeout);
        } else {
            $body.enjoyhint('hide');
            that.emit('end');
            destroyEnjoy();
        }

    };

    var nextStep = function(){
        that.emit('step.next', data[current_step]);        
        current_step++;
        stepAction();
    };
    var skipAll = function(){
        var step_data = data[current_step];
        var $element = $(step_data.selector);
        off(step_data.event);
        $element.off(makeEventName(step_data.event));
        that.emit('skip');
        destroyEnjoy();
    };

    var makeEventName = function (name, is_custom) {
        return name + (is_custom ? 'custom' : '') + '.enjoy_hint';
    };

    var on = function (event_name, callback) {
        $body.on(makeEventName(event_name, true), callback);
    };
    var off = function (event_name) {
        $body.off(makeEventName(event_name, true));
    };

    /********************* PUBLIC METHODS ***************************************/
    that.runScript = function () {
        current_step = 0;
        that.emit('start');
        stepAction();
    };

    that.resumeScript = function () {
        stepAction();
    };

    that.getCurrentStep = function () {
        return current_step;
    };

    that.trigger = function (event_name) {
        switch (event_name) {
            case 'next':
                nextStep();
                break
            case 'skip':
                skipAll();
                break
            default:
                var step = data[that.getCurrentStep()]; 
                if (step && step.event === event_name) {
                    nextStep();
                }
                break
        }
    };

    that.setScript = function (_data) {
        if (_data) {
            data = _data;
        }
    };

    //support deprecated API methods
    that.set = function (_data) {
        that.setScript(_data);
    };

    that.setSteps = function (_data) {
        that.setScript(_data);
    };

    that.run = function () {
        that.runScript();
    };

    that.resume = function () {
        that.resumeScript();
    };


    init();
};