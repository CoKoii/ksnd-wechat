import * as echarts from "../../../../components/ec-canvas/echarts";

Component({
  options: {
    styleIsolation: "apply-shared",
  },
  properties: {},
  data: {
    abnormalCount: 0, // 异常点位
    normalCount: 0, // 正常点位
    positionCount: 0, // 总点位数
    abnormalRate: 0.0, // 异常率
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
    // 计算数据
    calculateData() {
      const abnormalCount = this.data.abnormalCount;
      const normalCount = this.data.normalCount;
      const positionCount = this.data.positionCount;
      const total = abnormalCount + normalCount + positionCount;

      let abnormalRate = 0;
      if (total > 0) {
        abnormalRate = ((abnormalCount / total) * 100).toFixed(1);
      }

      this.setData({
        abnormalRate: abnormalRate,
      });
    },

    // 初始化图表配置
    initChart() {
      const abnormalCount = this.data.abnormalCount;
      const normalCount = this.data.normalCount;
      const positionCount = this.data.positionCount;

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

      const abnormalCount = this.data.abnormalCount;
      const normalCount = this.data.normalCount;
      const positionCount = this.data.positionCount;

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
                itemStyle: { color: "#f56c6c" },
              },
              {
                value: normalCount,
                name: "正常点位",
                itemStyle: { color: "#2ac86d" },
              },
              {
                value: positionCount,
                name: "总点位数",
                itemStyle: { color: "#f59a23" },
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
