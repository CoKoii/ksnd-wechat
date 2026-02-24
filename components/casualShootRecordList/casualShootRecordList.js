Component({
  options: {
    styleIsolation: "apply-shared",
  },

  properties: {
    list: {
      type: Array,
      value: [],
    },
  },

  methods: {
    onRecordTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      if (Number.isNaN(index)) return;

      const records = Array.isArray(this.data.list) ? this.data.list : [];
      const item = records[index] || null;
      if (!item) return;

      this.triggerEvent("recordtap", {
        index,
        id: item.id || "",
        item,
      });
    },

    onPreviewImage(e) {
      const recordIndex = Number(e.currentTarget.dataset.recordIndex);
      const imageIndex = Number(e.currentTarget.dataset.imageIndex);
      if (Number.isNaN(recordIndex) || Number.isNaN(imageIndex)) return;

      const records = Array.isArray(this.data.list) ? this.data.list : [];
      const record = records[recordIndex] || {};
      const previewImages = Array.isArray(record.previewImages)
        ? record.previewImages
        : [];
      const urls = previewImages
        .map((img) => String((img && img.url) || "").trim())
        .filter(Boolean);
      if (!urls.length) return;

      this.triggerEvent("previewopen", {
        recordIndex,
        imageIndex,
        id: record.id || "",
      });
      wx.previewImage({
        current: urls[imageIndex] || urls[0],
        urls,
        fail: () => {
          this.triggerEvent("previewfail", {
            recordIndex,
            imageIndex,
            id: record.id || "",
          });
        },
      });
    },
  },
});
