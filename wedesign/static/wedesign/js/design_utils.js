/*
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
*/
define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DesignUtils;
    (function (DesignUtils) {
        function downloadSVG(svg_element, filename) {
            const s = new XMLSerializer().serializeToString(svg_element);
            const d = "data:image/svg+xml;base64," + window.btoa(s);
            downloadURI(d, filename);
        }
        DesignUtils.downloadSVG = downloadSVG;
        function downloadText(text, filename) {
            const d = "data:text/plain;base64," + window.btoa(text);
            downloadURI(d, filename);
        }
        DesignUtils.downloadText = downloadText;
        function downloadCSV(csv, filename) {
            const d = "data:text/csv;base64," + window.btoa(csv);
            downloadURI(d, filename);
        }
        DesignUtils.downloadCSV = downloadCSV;
        function downloadJson(json, filename) {
            const d = "data:application/json;base64," + window.btoa(json);
            downloadURI(d, filename);
        }
        DesignUtils.downloadJson = downloadJson;
        function downloadURI(uri, name) {
            const link = document.createElement("a");
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        DesignUtils.downloadURI = downloadURI;
        function downloadPNG(svg_element, filename) {
            const w = svg_element.getBBox().width;
            const h = svg_element.getBBox().height;
            const can = document.createElement('canvas');
            const ctx = can.getContext('2d');
            const loader = new Image;
            loader.width = can.width = w * 4;
            loader.height = can.height = h * 4;
            loader.onload = function () {
                ctx.drawImage(loader, 0, 0, loader.width, loader.height);
                downloadURI(can.toDataURL("image/png"), filename);
            };
            const svgAsXML = (new XMLSerializer).serializeToString(svg_element);
            loader.src = 'data:image/svg+xml,' + encodeURIComponent(svgAsXML);
        }
        DesignUtils.downloadPNG = downloadPNG;
        function registerVisibilityFilter(where, datatable) {
            const visibility_filter = where.getElementsByClassName("column-visibility-filter")[0];
            for (let i = 0; i < visibility_filter.childElementCount; ++i) {
                visibility_filter.children[i].selected = datatable.column(i).visible();
            }
            ($(visibility_filter).multiselect({
                buttonClass: 'btn btn-default btn-xs',
                onChange: function (option, checked, select) {
                    for (const opt of option) {
                        datatable.column(opt.index).visible(checked);
                    }
                },
                buttonText: function (options, select) {
                    if (options.length == 0) {
                        return 'None';
                    }
                    else if (options.length == visibility_filter.childElementCount) {
                        return 'All';
                    }
                    else {
                        return `Some (${options.length})`;
                    }
                }
            }));
        }
        DesignUtils.registerVisibilityFilter = registerVisibilityFilter;
        function configureDatatable(datatable_html, options) {
            const common = {
                deferRender: true,
                autoWidth: false,
                stateSave: true,
                stateSaveCallback: function (settings, data) {
                    localStorage.setItem('DataTables_' + settings.nTable.classList[0], JSON.stringify(data));
                },
                stateLoadCallback: function (settings) {
                    return JSON.parse(localStorage.getItem('DataTables_' + settings.nTable.classList[0]));
                },
            };
            return $(datatable_html).DataTable(Object.assign(options, common));
        }
        DesignUtils.configureDatatable = configureDatatable;
    })(DesignUtils = exports.DesignUtils || (exports.DesignUtils = {}));
});
