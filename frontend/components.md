# 前端组件文档

此文档记录所有重构后的 Vue 组件。

## FButton
基础按钮组件，用于替换原有的 `.btn` 元素。

### Props (参数)
- `variant`: string, 可选。按钮样式变体。
- `loading`: boolean, 可选。
- `disabled`: boolean, 可选。
- `type`: string, 可选。

### Events (事件)
- `click`: 点击事件。

## FCalendar
日历组件，内部处理日期计算和展示。

### Props (参数)
- `training-days`: Object, 记录映射表。
- `initial-date`: String, 初始年月 (YYYY-MM-DD)。

### Events (事件)
- `month-change`: 切换月份。
- `day-click`: 点击日期。

## FDialog
对话框/模态框组件，用于替换原有的 `.modal-container`。

### Props (参数)
- `show`: boolean, 是否显示对话框。
- `persistent`: boolean, 点击遮罩层是否不关闭。

### Events (事件)
- `close`: 关闭对话框时触发。

### Usage (使用示例)
```html
<f-dialog id="my-dialog">
  <div class="content">这是对话框内容</div>
</f-dialog>
```
在 JS 中控制显示：
```javascript
document.getElementById('my-dialog').show = true;
```
