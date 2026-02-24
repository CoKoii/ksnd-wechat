import * as echarts from "../../../../components/ec-canvas/echarts";

const CHART_COLORS = {
  abnormal: "#f56c6c",
  normal: "#2ac86d",
  position: "#f59a23",
};

Component({
  options: {
    styleIsolation: "apply-shared",
  },
  properties: {},
  data: {
    abnormalCount: 0,
    normalCount: 0,
    positionCount: 0,
    abnormalRate: 0.0,
    chartOption: {
      onInit: null,
    },
  },
  lifetimes: {
    attached() {
      this.calculateData();
      this.initChart();
    },
  },
  methods: {
    calculateData() {
      const { abnormalCount, normalCount, positionCount } = this.data;
      const total = abnormalCount + normalCount + positionCount;
      const abnormalRate =
        total > 0 ? ((abnormalCount / total) * 100).toFixed(1) : 0;

      this.setData({
        abnormalRate,
      });
    },

    initChart() {
      this.setData({
        chartOption: {
          onInit: this.initEchart.bind(this),
        },
      });
    },

    initEchart(canvas, width, height, dpr) {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr,
      });
      canvas.setChart(chart);

      const { abnormalCount, normalCount, positionCount } = this.data;

      const option = {
        series: [
          {
            type: "pie",
            radius: ["60%", "80%"],
            center: ["50%", "50%"],
            avoidLabelOverlap: false,
            label: {
              show: false,
            },
            emphasis: {
              label: {
                show: false,
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              {
                value: abnormalCount,
                name: "异常点位",
                itemStyle: { color: CHART_COLORS.abnormal },
              },
              {
                value: normalCount,
                name: "正常点位",
                itemStyle: { color: CHART_COLORS.normal },
              },
              {
                value: positionCount,
                name: "总点位数",
                itemStyle: { color: CHART_COLORS.position },
              },
            ],
          },
        ],
      };

      chart.setOption(option);
      return chart;
    },
  },
});
