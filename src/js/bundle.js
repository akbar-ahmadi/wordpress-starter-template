import $ from 'jquery';
import apps from './apps/index';
import widgets from './widgets/index';
$(Document).ready(function () {
    apps();
    widgets();
});