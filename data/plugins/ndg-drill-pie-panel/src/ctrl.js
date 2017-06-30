import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import config from 'app/core/config';
import TimeSeries from 'app/core/time_series2';
//import * as d3 from '../bower_components/d3/d3.js';
import * as d3 from './external/d3.v3.min';
import './css/psd3.css!';
import './external/psd3';

const panelDefaults = {
  fontSizes: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70],
  fontTypes: [
    'Arial', 'Avant Garde', 'Bookman',
    'Consolas', 'Courier', 'Courier New',
    'Garamond', 'Helvetica', 'Open Sans',
    'Palatino', 'Times', 'Times New Roman',
    'Verdana'
  ],
  pieConfig: {
    donutRadius: 10,
    legendRemap: {'Pay Calcio':'Calcio','Mediaset Storiche':'Storiche','Mediaset Tematiche': 'Tematiche', 'Pay Intrattenimento': 'Intrattenimento'},
    strokeColor: "rgb(31, 27, 27)",
    strokeWidth: 2,
    highlightColor: "grey",
    labelColor: "black"
  }
};

class D3DrillPiePanelCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, alertSrv) {
    super($scope, $injector);
    // merge existing settings with our defaults
    _.defaults(this.panel, panelDefaults);
    this.panel.gaugeDivId = 'd3piedrill_svg_' + this.panel.id;
    this.scoperef = $scope;
    this.alertSrvRef = alertSrv;
    this.initialized = false;
    this.panelContainer = null;
    this.svg = null;
    this.panelWidth = null;
    this.panelHeight = null;
    this.data = [];
    this.pie = null;

    //console.log("D3GaugePanelCtrl constructor!");
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    //console.log("D3GaugePanelCtrl constructor done!");
  }

  onInitEditMode() {
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

  /**
   * [setContainer description]
   * @param {[type]} container [description]
   */
  setContainer(container) {
    this.panelContainer = container;
  }

  getPanelWidth() {
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

  getPanelHeight() {
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
    }
    else {
      // convert to numeric value
      tmpPanelHeight = tmpPanelHeight.replace("px","");
    }
    var actualHeight = parseInt(tmpPanelHeight);
    // grafana minimum height for a panel is 250px
    if (actualHeight < 250) {
      actualHeight = 250;
    }
    return actualHeight;
  }

  clearSVG() {
    if ($('#'+this.panel.gaugeDivId).length) {
      //console.log("Clearing SVG");
      $('#'+this.panel.gaugeDivId).remove();
    }
  }
  onRender() {
    // update the values to be sent to the gauge constructor
   // this.setValues(this.data);
    //console.log("Render D3");
   // this.clearSVG();
    // use jQuery to get the height on our container
    this.panelWidth = this.getPanelWidth();
    this.panelHeight = this.getPanelHeight();

    var margin = {top: 10, right: 0, bottom: 30, left: 0};
    var width = this.panelWidth;
    var height = this.panelHeight;

    if (width > 217) {
      width = 217;
    }

    var minDim = height;
    if (height > width) {
      minDim = width;
    }

    minDim = minDim -60;
    height = minDim;
    width = minDim;

    var config = {
      containerId: this.panel.gaugeDivId,
      width: width,
      height: height,
      data: this.data,
      gradient: true,
      label: function (d) {
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
      tooltip: function (d) {
        return "<p style='font-weight: bold;'>" + d.name + "</p><p>Count: " + d.value + "</p><p>Percent: " + d.percent + "%</p>";
      },
      transition: "bounce",
      transitionDuration: 250,
      donutRadius: this.panel.pieConfig.donutRadius,
      legendId: this.panel.gaugeDivId+'Legend',
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
      this.pie.config.legendRemap =  this.panel.pieConfig.legendRemap;
      this.pie.config.stroke = this.panel.pieConfig.strokeColor;
      this.pie.config.strokeWidth = this.panel.pieConfig.strokeWidth;
      this.pie.config.highlightColor = this.panel.pieConfig.highlightColor;
      this.pie.config.labelColor = this.panel.pieConfig.labelColor;
      this.pie.config.legendColor = this.panel.pieConfig.legendColor;

      this.pie.replace(this.data);
    }
  }

  removeValueMap(map) {
    var index = _.indexOf(this.panel.valueMaps, map);
    this.panel.valueMaps.splice(index, 1);
    this.render();
  }

  addValueMap() {
    this.panel.valueMaps.push({value: '', op: '=', text: '' });
  }

  removeRangeMap(rangeMap) {
    var index = _.indexOf(this.panel.rangeMaps, rangeMap);
    this.panel.rangeMaps.splice(index, 1);
    this.render();
  }

  addRangeMap() {
    this.panel.rangeMaps.push({from: '', to: '', text: ''});
  }


  link(scope, elem, attrs, ctrl) {
    //console.log("d3gauge inside link");
    ctrl.setContainer(elem.find('.grafana-d3-drill-pie'));
    // Check if there is a gauge rendered
    var renderedSVG = $('#'+this.panel.gaugeDivId);
    // console.log("link: found svg length " + renderedSVG.length);
    if (renderedSVG.length === 0) {
      // no gauge found, force a render
      this.render();
    }
  }


  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return {decimals: this.panel.decimals, scaledDecimals: null};
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec),
        norm = delta / magn, // norm is between 1.0 and 10.0
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
    if (Math.floor(value) === value) { dec = 0; }

    var result = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;
    return result;
  }

  getValueText() {
    return this.data.valueFormatted;
  }

  getValueRounded() {
    return this.data.valueRounded;
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError(err) {
    this.onDataReceived([]);
  }

  onDataReceived(dataList) {
   // this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = dataList;
    //console.log("Data value: " + data.value + " formatted: " + data.valueFormatted + " rounded: " + data.valueRounded );
    //var fmtTxt = kbn.valueFormats[this.panel.format];
    //console.log("Format: " + fmtTxt);
    this.render();
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });
    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  invertColorOrder() {
    var tmp = this.panel.colors[0];
    this.panel.colors[0] = this.panel.colors[2];
    this.panel.colors[2] = tmp;
    this.render();
  }
}

function getColorForValue(data, value) {
  for (var i = data.thresholds.length; i > 0; i--) {
    if (value >= data.thresholds[i-1]) {
      return data.colorMap[i];
    }
  }
  return _.first(data.colorMap);
}

D3DrillPiePanelCtrl.templateUrl = 'partials/template.html';
export {
  D3DrillPiePanelCtrl,
  D3DrillPiePanelCtrl as MetricsPanelCtrl
};
