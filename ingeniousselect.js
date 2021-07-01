;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'));
    } else {
        root.ingeniousselect = factory(root.jQuery);
    }
}(this, function ($) {
    var initialized = false;
    var resizePuffer = 100; //Timeout in ms

    $.fn.ingeniousselect = function(settings) {
        var resized = false;
        var resizeTimeout;

        function getClass(name) {
            return settings.prefix + name;
        }

        function getClassSelector(name) {
            return '.' + getClass(name);
        }

        if (typeof settings !== 'object') {
            settings = {};
        } else if (settings.prefix && settings.prefix.indexOf('-') != (settings.prefix.length - 1)) {
            settings.prefix = settings.prefix+'-';
        }

        settings = $.extend({
            prefix: 'ingeniousSelect-',
            minDeviceWidth: 768,
            optionsSlideSpeed: 300,
            containOptionsWidth: false,
            disablePortal: false, // TODO
            portalClassName: '',
        }, settings);

        var portalStyles = 'opacity: 0; pointer-events: none; position: fixed; z-index: 50; top: 0; right: 0; bottom: 0; left: 0;';
        var portalVisibleStyles = 'opacity: 1;';
        var selectStyles = 'width: 100%; z-index: 0;';
        var selectWrapperStyles = 'position: relative';
        var selectOverlayStyles = 'position :absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;';
        var optionsWrapperStyles = 'display: none; position: absolute; overflow-y: auto; pointer-events: auto; z-index: 1;';
        var optionsWrapperVisibleStyles = 'z-index: 2;';
        var optionsWrapperOptionStyles = 'white-space: nowrap; cursor: pointer;';

        $(document.head).append('<style data-ingeniousselect-default-styles>' +
            getClassSelector('portal') + '{' + portalStyles + '}' +
            getClassSelector('portal--visible') + '{' + portalVisibleStyles + '}' +
            getClassSelector('select') + '{' + selectStyles + '}' +
            getClassSelector('selectWrapper') + '{' + selectWrapperStyles + '}' +
            getClassSelector('selectOverlay') + '{' + selectOverlayStyles + '}' +
            getClassSelector('optionsWrapper') + '{' + optionsWrapperStyles + '}' +
            getClassSelector('optionsWrapper--visible') + '{' + optionsWrapperVisibleStyles + '}' +
            getClassSelector('optionsWrapper__option') + '{' + optionsWrapperOptionStyles + '}' +
        '</style>');

        var portal = $('<div class="' + getClass('portal') + ' ' + settings.portalClassName + '"></div>');

        function showPortal() {
            $(document.body).css('overflow', 'hidden');
            portal.addClass(getClass('portal--visible'));
        }

        function hidePortal() {
            $(document.body).css('overflow', '');
            portal.removeClass(getClass('portal--visible'));
        }

        var setOptionsWrapperPosition = function($select) {
            var optionsWrapper = portal.find(getClassSelector('optionsWrapper') + '[data-select-id=' + $select.attr('id') + ']');
            var selectTopOffset = $select.offset().top - window.pageYOffset;
            var selectLeftOffset = $select.offset().left - window.pageXOffset;
            var selectHeight = $select.outerHeight();
            var selectBottomOffset = window.innerHeight - selectTopOffset - selectHeight;
            var renderOptionsAboveSelect = optionsWrapper.outerHeight() + 20 > selectBottomOffset;

            optionsWrapper.css({
                left: selectLeftOffset,
                top: renderOptionsAboveSelect ? 'auto' : selectTopOffset + selectHeight,
                bottom: renderOptionsAboveSelect ? selectBottomOffset + selectHeight : 'auto'
            });

            if (settings.containOptionsWidth) {
                optionsWrapper.css('width', $select.outerWidth())
            }

            optionsWrapper.toggleClass(getClass('optionsWrapper--top', renderOptionsAboveSelect)).toggleClass(getClass('optionsWrapper--bottom', !renderOptionsAboveSelect));
        };

        var showSelect = function($select) {
            hideAllSelects();
            var selectWrapper = $select.parent();
            var selectId = $select.attr('id');
            var optionsWrapper = portal.find(getClassSelector('optionsWrapper') + '[data-select-id=' + selectId + ']');
            optionsWrapper.addClass(getClass('optionsWrapper--visible'));
            optionsWrapper.slideDown(settings.optionsSlideSpeed);
            selectWrapper.addClass(getClass('selectWrapper--open'));
        };

        var hideSelect = function($select) {
            if (!$select.length) return null;

            var selectId = $select.attr('id');

            $(getClassSelector('optionsWrapper[data-select-id=' + selectId + ']'))
                .removeClass(getClass('optionsWrapper--visible'))
                .slideUp(settings.optionsSlideSpeed, function () {
                    if (!$(getClassSelector('optionsWrapper--visible')).length) {
                        hidePortal();
                    }
                });
            $(getClassSelector('selectWrapper--open')).removeClass(getClass('selectWrapper--open'));
        };

        function hideAllSelects() {
            hideSelect($(getClassSelector('selectWrapper--open')).find('select'));
        }

        var setOptionsAndGroupsForWrapper = function($select) {
            var selectId = $select.attr('id');
            var optionsWrapper = portal.find(getClassSelector('optionsWrapper') + '[data-select-id=' + selectId + ']');

            //Optionen bzw Gruppen neu vom Select holen und in den wrapper schieben
            optionsWrapper.html('');

            if ($select.find('optgroup').length) {
                $select.find('optgroup').each(function(index, optgroup) {
                    var optionGroup = $( "<div/>", {
                        class: getClass('optionsWrapper__group') + ' ' + optgroup.className
                    });
                    var optionGroupText = $( "<div/>", {
                        class: getClass('optionsWrapper__group__text'),
                        text: optgroup.label
                    });
                    optionGroupText.appendTo( optionGroup.appendTo( optionsWrapper ) );
                    setOptions($select, $(optgroup), optionGroup);
                });
            } else {
                setOptions($select, $select, optionsWrapper);
            }
        };

        var setOptions = function($select, $parent, addToNode) {
            $parent.find('option').each(function(index, element) {
                var $element = $(element);
                var className = [getClass('optionsWrapper__option') + ' ' + element.className];
                if ($element.attr('value') === $select.val()) {
                    className.push(getClass('optionsWrapper__option--selected'));
                }
                if ($element.attr('disabled')) {
                    className.push(getClass('optionsWrapper__option--disabled'));
                }

                var optionItem = $( "<div/>", {
                    class: className.join(' '),
                    text: $element.text(),
                    'data-value': $element.attr('value')
                });

                optionItem.on('click', function (e) {
                    $select.val($(e.target).data('value'));
                    $select.trigger('change');
                    hideSelect($select);
                });

                addToNode.append(optionItem);
            });
        };

        var useNativeSelect = function(selects) {
            if ($(selects[0]).parent().data('hasClickEvent') === false) {
                return;
            } else {
                $(selects[0]).parent().data('hasClickEvent', false);
            }

            selects.each(function(index, select) {
                $(select).parent().off('click.ingeniousselect');
                var selectWrapper = $(select).parent();

                if (!selectWrapper.hasClass(getClass('selectWrapper--useNative'))) {
                    selectWrapper.addClass(getClass('selectWrapper--useNative'));
                    selectWrapper.find(getClassSelector('selectOverlay')).css('z-index', '-1');
                }
            });
        };

        var useIngeniousSelect = function(selects) {
            if ($(selects[0]).parent().data('hasClickEvent') === true) {
                return;
            } else {
                $(selects[0]).parent().data('hasClickEvent', true);
            }

            selects.each(function(index, select) {
                addClickHandler(select);
                var selectWrapper = $(select).parent();

                if (selectWrapper.hasClass(getClass('selectWrapper--useNative'))) {
                    selectWrapper.removeClass(getClass('selectWrapper--useNative'));
                    selectWrapper.find(getClassSelector('selectOverlay')).css('z-index', '1');
                }
            });
        };

        var onResize = (function() {
            if (!resized) {
                resized = true;
                resizeTimeout = setTimeout((function () {
                    clearTimeout(resizeTimeout);

                    if ($(window).width() < settings.minDeviceWidth) {
                        useNativeSelect(this);
                    } else {
                        useIngeniousSelect(this);
                    }
                    resized = false;
                }).bind(this), resizePuffer);
            }
        }).bind(this);

        var addClickHandler = function(select) {
            $(select).parent().data('hasClickEvent', true);

            $(select).parent().on('click.ingeniousselect', function(e) {
                if (select.disabled) return false;
                showPortal();
                setOptionsAndGroupsForWrapper($(select));
                setOptionsWrapperPosition($(select));

                //Optionen sichtbar/unsichtbar schalten
                var $optionsWrapper = $(select).parent().find(getClassSelector('optionsWrapper'));

                if ($optionsWrapper.hasClass(getClass('optionsWrapper--visible'))) {
                    hideSelect($(select));
                } else {
                    showSelect($(select));
                }
            });
        };

        this.each(function(index, select) {
            if (!$(select).data('ingenousselect-initialized')) {
                var selectId = select.getAttribute('id');

                if (!selectId.length) {
                    if (window.ingeniousselectNextUniqueId === undefined) {
                        window.ingeniousselectNextUniqueId = 1;
                    }
                    selectId = 'ingenousselect-select' + window.ingeniousselectNextUniqueId;
                    $(select).attr('id', selectId);
                    window.ingeniousselectNextUniqueId++;
                }

                //Select holen und Div-Struktur entsprechend anpassen
                $(select).addClass(getClass('select'));
                $(select).wrap('<div class="' + getClass('selectWrapper') + '"></div>');
                $(select).parent().append('<div class="' + getClass('selectOverlay') + '"></div>');
                $(select).data('ingenousselect-initialized', true);
                portal.append('<div data-select-id="' + selectId + '" class="' + getClass('optionsWrapper') + '"></div>');
            } else {
                console.warn('This selectelement ist already initialized. Every selectelement can only be initialized once.', select);
            }
        });

        $(document.body).append(portal);

        $(window).resize((function() {
            onResize();
        }).bind(this));
        onResize();

        function onSelectClicked($select) {
            // TODO?
        }

        if (!initialized) {
            initialized = true;

            $(window).on('click', function (e) {
                if (e.target.hasAttributes('for')) {
                    var forAttr = e.target.getAttribute('for');
                    var $targetedSelect = $(getClassSelector('select') + '#' + forAttr);
                    if ($targetedSelect.length) {
                        onSelectClicked($targetedSelect);
                        return null;
                    }
                }

                if ($(e.target).hasClass(getClass('selectOverlay'))) {
                    onSelectClicked($(e.target).prev(getClassSelector('select')));
                    return null;
                }

                if ($(e.target).closest(getClassSelector('portal')).length) {
                    // TODO?
                    return null;
                }

                if ($(e.target).hasClass(getClass('select'))) {
                    // TODO?
                    return null;
                }

                hideAllSelects();
            });
        }

        return this;
    };
}));
