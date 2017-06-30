'use strict';

System.register(['app/plugins/sdk', 'lodash', 'jquery', 'app/core/utils/kbn', 'app/core/config', 'app/core/time_series2', './external/d3.v3.min', './css/psd3.css!', './external/psd3'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, $, kbn, config, TimeSeries, d3, _createClass, panelDefaults, D3DrillPiePanelCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function getColorForValue(data, value) {
    for (var i = data.thresholds.length; i > 0; i--) {
      if (value >= data.thresholds[i - 1]) {
        return data.colorMap[i];
      }
    }
    return _.first(data.colorMap);
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_externalD3V3Min) {
      d3 = _externalD3V3Min;
    }, function (_cssPsd3Css) {}, function (_externalPsd) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      panelDefaults = {
        fontSizes: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70],
        fontTypes: ['Arial', 'Avant Garde', 'Bookman', 'Consolas', 'Courier', 'Courier New', 'Garamond', 'Helvetica', 'Open Sans', 'Palatino', 'Times', 'Times New Roman', 'Verdana'],
        pieConfig: {
          donutRadius: 10,
          legendRemap: { 'Pay Calcio': 'Calcio', 'Mediaset Storiche': 'Storiche', 'Mediaset Tematiche': 'Tematiche', 'Pay Intrattenimento': 'Intrattenimento' },
          strokeColor: "white",
          strokeWidth: 2,
          highlightColor: "grey",
          labelColor: "black"
        }
      };

      _export('MetricsPanelCtrl', _export('D3DrillPiePanelCtrl', D3DrillPiePanelCtrl = function (_MetricsPanelCtrl) {
        _inherits(D3DrillPiePanelCtrl, _MetricsPanelCtrl);

        function D3DrillPiePanelCtrl($scope, $injector, alertSrv) {
          _classCallCheck(this, D3DrillPiePanelCtrl);

          var _this = _possibleConstructorReturn(this, (D3DrillPiePanelCtrl.__proto__ || Object.getPrototypeOf(D3DrillPiePanelCtrl)).call(this, $scope, $injector));

          // merge existing settings with our defaults
          _.defaults(_this.panel, panelDefaults);
          _this.panel.gaugeDivId = 'd3piedrill_svg_' + _this.panel.id;
          _this.scoperef = $scope;
          _this.alertSrvRef = alertSrv;
          _this.initialized = false;
          _this.panelContainer = null;
          _this.svg = null;
          _this.panelWidth = null;
          _this.panelHeight = null;
          _this.data = [];
          _this.pie = null;

          //console.log("D3GaugePanelCtrl constructor!");
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('render', _this.onRender.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
          //console.log("D3GaugePanelCtrl constructor done!");
          return _this;
        }

        _createClass(D3DrillPiePanelCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            // determine the path to this plugin
            var panels = grafanaBootData.settings.panels;
            var thisPanel = panels[this.pluginId];
            var thisPanelPath = thisPanel.baseUrl + '/';
            // add the relative path to the partial
            var optionsPath = thisPanelPath + 'partials/editor.options.html';
            this.addEditorTab('Options', optionsPath, 2);
            /*var radialMetricsPath = thisPanelPath + 'partials/editor.radialmetrics.html';
            this.addEditorTab('Radial Metrics', radialMetricsPath, 3);
            var thresholdingPath = thisPanelPath + 'partials/editor.thresholding.html';
            this.addEditorTab('Thresholding', thresholdingPath, 4);
            var mappingsPath = thisPanelPath + 'partials/editor.mappings.html';
            this.addEditorTab('Value Mappings', mappingsPath, 5);
            */
          }
        }, {
          key: 'setContainer',
          value: function setContainer(container) {
            this.panelContainer = container;
          }
        }, {
          key: 'getPanelWidth',
          value: function getPanelWidth() {
            // with a full sized panel, this comes back as zero, so calculate from the div panel instead
            var tmpPanelWidth = this.panelContainer[0].clientWidth;
            if (tmpPanelWidth === 0) {
              // just use the height...
              tmpPanelWidth = this.getPanelHeight();
              tmpPanelWidth -= 24;
              if (tmpPanelWidth < 250) {
                tmpPanelWidth = 250;
              }
              return tmpPanelWidth;
              //var tmpPanelWidthCSS = $("div.panel").css("width");
              //var tmpPanelWidthPx = tmpPanelWidthCSS.replace("px","");
              //tmpPanelWidth = parseInt(tmpPanelWidthPx);
            }
            var actualWidth = tmpPanelWidth;
            return actualWidth;
          }
        }, {
          key: 'getPanelHeight',
          value: function getPanelHeight() {
            // panel can have a fixed height via options
            var tmpPanelHeight = this.$scope.ctrl.panel.height;
            // if that is blank, try to get it from our row
            if (typeof tmpPanelHeight === 'undefined') {
              // get from the row instead
              tmpPanelHeight = this.row.height;
              // default to 250px if that was undefined also
              if (typeof tmpPanelHeight === 'undefined') {
                tmpPanelHeight = 250;
              }
            } else {
              // convert to numeric value
              tmpPanelHeight = tmpPanelHeight.replace("px", "");
            }
            var actualHeight = parseInt(tmpPanelHeight);
            // grafana minimum height for a panel is 250px
            if (actualHeight < 250) {
              actualHeight = 250;
            }
            return actualHeight;
          }
        }, {
          key: 'clearSVG',
          value: function clearSVG() {
            if ($('#' + this.panel.gaugeDivId).length) {
              //console.log("Clearing SVG");
              $('#' + this.panel.gaugeDivId).remove();
            }
          }
        }, {
          key: 'onRender',
          value: function onRender() {
            // update the values to be sent to the gauge constructor
            // this.setValues(this.data);
            //console.log("Render D3");
            // this.clearSVG();
            // use jQuery to get the height on our container
            this.panelWidth = this.getPanelWidth();
            this.panelHeight = this.getPanelHeight();

            var margin = { top: 10, right: 0, bottom: 30, left: 0 };
            var width = this.panelWidth;
            var height = this.panelHeight;

            if (width > 217) {
              width = 217;
            }

            var minDim = height;
            if (height > width) {
              minDim = width;
            }

            minDim = minDim - 60;
            height = minDim;
            width = minDim;

            var config = {
              containerId: this.panel.gaugeDivId,
              width: width,
              height: height,
              data: this.data,
              gradient: true,
              label: function label(d) {
                /*
                 var remap = {'Pay Calcio':'Calcio','Mediaset Storiche':'Storiche','Mediaset Tematiche': 'Tematiche', 'Pay Intrattenimento': 'Intratt.'};
                 if (remap[d.data.name]) {
                 return remap[d.data.name];
                 } else {
                 return d.data.name;
                 }*/
                return d.data.percent + "%";
              },
              labelColor: this.panel.pieConfig.labelColor,
              value: "value",
              inner: "drilldown",
              tooltip: function tooltip(d) {
                return "<p style='font-weight: bold;'>" + d.name + "</p><p>Count: " + d.value + "</p><p>Percent: " + d.percent + "%</p>";
              },
              transition: "bounce",
              transitionDuration: 250,
              donutRadius: this.panel.pieConfig.donutRadius,
              legendId: this.panel.gaugeDivId + 'Legend',
              legendRemap: this.panel.pieConfig.legendRemap,
              stroke: this.panel.pieConfig.strokeColor,
              strokeWidth: this.panel.pieConfig.strokeWidth,
              highlightColor: this.panel.pieConfig.highlightColor
            };
            if (this.data !== undefined && Array.isArray(this.data) && this.data.length > 0) {
              if (this.pie === null) {
                this.pie = new psd3.Pie(config);
                this.pie.config.transitionDuration = 0;
              }
              this.pie.config.donutRadius = this.panel.pieConfig.donutRadius;
              this.pie.config.legendRemap = this.panel.pieConfig.legendRemap;
              this.pie.config.stroke = this.panel.pieConfig.strokeColor;
              this.pie.config.strokeWidth = this.panel.pieConfig.strokeWidth;
              this.pie.config.highlightColor = this.panel.pieConfig.highlightColor;
              this.pie.config.labelColor = this.panel.pieConfig.labelColor;
              this.pie.config.legendColor = this.panel.pieConfig.legendColor;

              this.pie.replace(this.data);
            }
          }
        }, {
          key: 'removeValueMap',
          value: function removeValueMap(map) {
            var index = _.indexOf(this.panel.valueMaps, map);
            this.panel.valueMaps.splice(index, 1);
            this.render();
          }
        }, {
          key: 'addValueMap',
          value: function addValueMap() {
            this.panel.valueMaps.push({ value: '', op: '=', text: '' });
          }
        }, {
          key: 'removeRangeMap',
          value: function removeRangeMap(rangeMap) {
            var index = _.indexOf(this.panel.rangeMaps, rangeMap);
            this.panel.rangeMaps.splice(index, 1);
            this.render();
          }
        }, {
          key: 'addRangeMap',
          value: function addRangeMap() {
            this.panel.rangeMaps.push({ from: '', to: '', text: '' });
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            //console.log("d3gauge inside link");
            ctrl.setContainer(elem.find('.grafana-d3-drill-pie'));
            // Check if there is a gauge rendered
            var renderedSVG = $('#' + this.panel.gaugeDivId);
            // console.log("link: found svg length " + renderedSVG.length);
            if (renderedSVG.length === 0) {
              // no gauge found, force a render
              this.render();
            }
          }
        }, {
          key: 'getDecimalsForValue',
          value: function getDecimalsForValue(value) {
            if (_.isNumber(this.panel.decimals)) {
              return { decimals: this.panel.decimals, scaledDecimals: null };
            }

            var delta = value / 2;
            var dec = -Math.floor(Math.log(delta) / Math.LN10);

            var magn = Math.pow(10, -dec),
                norm = delta / magn,
                // norm is between 1.0 and 10.0
            size;

            if (norm < 1.5) {
              size = 1;
            } else if (norm < 3) {
              size = 2;
              // special case for 2.5, requires an extra decimal
              if (norm > 2.25) {
                size = 2.5;
                ++dec;
              }
            } else if (norm < 7.5) {
              size = 5;
            } else {
              size = 10;
            }

            size *= magn;

            // reduce starting decimals if not needed
            if (Math.floor(value) === value) {
              dec = 0;
            }

            var result = {};
            result.decimals = Math.max(0, dec);
            result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;
            return result;
          }
        }, {
          key: 'getValueText',
          value: function getValueText() {
            return this.data.valueFormatted;
          }
        }, {
          key: 'getValueRounded',
          value: function getValueRounded() {
            return this.data.valueRounded;
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(subItem) {
            this.panel.format = subItem.value;
            this.render();
          }
        }, {
          key: 'onDataError',
          value: function onDataError(err) {
            this.onDataReceived([]);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            // this.series = dataList.map(this.seriesHandler.bind(this));
            this.data = dataList;
            //console.log("Data value: " + data.value + " formatted: " + data.valueFormatted + " rounded: " + data.valueRounded );
            //var fmtTxt = kbn.valueFormats[this.panel.format];
            //console.log("Format: " + fmtTxt);
            this.render();
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });
            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'invertColorOrder',
          value: function invertColorOrder() {
            var tmp = this.panel.colors[0];
            this.panel.colors[0] = this.panel.colors[2];
            this.panel.colors[2] = tmp;
            this.render();
          }
        }]);

        return D3DrillPiePanelCtrl;
      }(MetricsPanelCtrl)));

      D3DrillPiePanelCtrl.templateUrl = 'partials/template.html';

      _export('D3DrillPiePanelCtrl', D3DrillPiePanelCtrl);

      _export('MetricsPanelCtrl', D3DrillPiePanelCtrl);
    }
  };
});
//# sourceMappingURL=ctrl.js.map
