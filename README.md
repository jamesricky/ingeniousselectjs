# IngeniousSelectjs

IngeniousSelect is a small jQuery plugin, that makes one or more select elements styleable. It could be used as an alternativ for selectric. The problem with selectric is that you don't get a change-event if the value of the original select is set with vanilla-javacript or if the optionslist changes on the fly. Ingeniousselect doesn't have these problems, because it uses the original selectfield. The options are copied to a separate div-structure that will update on every click on the select.

## Usage

```javascript
$(".mySelect").ingeniousselect();
```

### With options

```javascript
$(".mySelect").ingeniousselect({
  prefix: "myPrefix",
  minDeviceWidth: 540,
});
```

### Options

| Option              | Type    | Default value     | Description                                                                                                                                                                     |
| ------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prefix              | string  | "ingeniousSelect" | Prefix added to class-names of IngeniousSelect elements.                                                                                                                        |
| minDeviceWidth      | number  | 768               | Set the minimum window-width at which IngeniousSelect should be initialized. Below this with the browsers native select will be used. Set to "0" to always use IngeniousSelect. |
| disablePortal       | boolean | false             | Disable rendering select options inside portal.                                                                                                                                 |
| optionsSlideSpeed   | number  | 300               | The duration of the opening/closing animation of the options-wrapper in milliseconds.                                                                                           |
| containOptionsWidth | boolean | false             | Force the width of the option-items to be the same with as the select itself.                                                                                                   |
| portalClassName     | string  | -                 | Additional class-name added to portal.                                                                                                                                          |
