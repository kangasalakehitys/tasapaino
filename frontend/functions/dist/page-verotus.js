(() => {
  // frontend/functions/format.js
  var intFmt = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
  var pctFmt = new Intl.NumberFormat("fi-FI", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmtInt = (n) => intFmt.format(n);
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  // frontend/components/tax-simulator.js
  var nf0 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtMe = (v) => `${v >= 0 ? "+" : "−"}${nf2.format(Math.abs(v) / 1e6)} M€`;
  var PROPERTY_LIMITS = {
    general: { label: "Yleinen (rakennukset)", min: 0.93, max: 2 },
    land: { label: "Maapohja", min: 1.3, max: 2 },
    residential: { label: "Vakituinen asuinrakennus", min: 0.41, max: 1 },
    otherResidential: { label: "Muu asuinrakennus", min: 0.93, max: 2 }
  };
  var TaxSimulator = class extends HTMLElement {
    setData(data) {
      this.data = data;
      this.classList.add("tax-sim");
      const { income, property } = data;
      const propertyRows = Object.entries(PROPERTY_LIMITS).filter(([use]) => property?.uses?.[use]?.value).map(([use, lim]) => {
        const u = property.uses[use];
        return `
          <div class="tax-sim__row" data-use="${use}">
            <label for="sim-${use}">${escapeHtml(lim.label)}
              <span class="tax-sim__hint">nyt ${nf2.format(u.rate)} %, laki ${nf2.format(lim.min)}–${nf2.format(lim.max)} %,
              verotusarvo ${nf0.format(u.value / 1e6)} M€</span></label>
            <input id="sim-${use}" type="range" min="${lim.min}" max="${lim.max}" step="0.01" value="${u.rate}">
            <output class="tax-sim__rate"></output>
            <output class="tax-sim__effect"></output>
          </div>`;
      }).join("");
      this.innerHTML = `
      <form class="tax-sim__form" onsubmit="return false">
        <fieldset>
          <legend>Kunnallisvero (tuloveroprosentti)</legend>
          <div class="tax-sim__row" data-use="income">
            <label for="sim-income">Tuloveroprosentti
              <span class="tax-sim__hint">nyt ${nf2.format(income.rate)} %, verotettava ansiotulo ${nf0.format(income.taxableEarned / 1e6)} M€ (verovuosi ${income.year})</span></label>
            <input id="sim-income" type="range" min="${(income.rate - 1.5).toFixed(2)}" max="${(income.rate + 1.5).toFixed(2)}" step="0.05" value="${income.rate}">
            <output class="tax-sim__rate"></output>
            <output class="tax-sim__effect"></output>
          </div>
        </fieldset>
        ${propertyRows ? `<fieldset><legend>Kiinteistöverot (verovuosi ${property.year})</legend>${propertyRows}</fieldset>` : ""}
        <button type="button" class="tax-sim__reset">Palauta nykyiset prosentit</button>
      </form>
      <div class="tax-sim__result" aria-live="polite"></div>`;
      this.querySelectorAll("input[type=range]").forEach((input) => input.addEventListener("input", () => this.update()));
      this.querySelector(".tax-sim__reset").addEventListener("click", () => this.setData(this.data));
      this.update();
      return this;
    }
    // Effects in euros by use.
    effects() {
      const { income, property } = this.data;
      const out = {};
      for (const row of this.querySelectorAll(".tax-sim__row")) {
        const use = row.dataset.use;
        const rate = Number(row.querySelector("input").value);
        const base = use === "income" ? income.taxableEarned : property.uses[use].value;
        const now = use === "income" ? income.rate : property.uses[use].rate;
        out[use] = { rate, delta: rate - now, euros: base * (rate - now) / 100 };
      }
      return out;
    }
    update() {
      const effects = this.effects();
      for (const row of this.querySelectorAll(".tax-sim__row")) {
        const e = effects[row.dataset.use];
        row.querySelector(".tax-sim__rate").textContent = `${nf2.format(e.rate)} % (${e.delta >= 0 ? "+" : "−"}${nf2.format(Math.abs(e.delta))})`;
        const out = row.querySelector(".tax-sim__effect");
        out.textContent = fmtMe(e.euros);
        out.className = `tax-sim__effect ${e.euros > 0 ? "pos" : e.euros < 0 ? "neg" : ""}`;
      }
      const total = Object.values(effects).reduce((s, e) => s + e.euros, 0);
      const { population, income } = this.data;
      const perPayer = income.recipients ? effects.income.euros / income.recipients : null;
      this.querySelector(".tax-sim__result").innerHTML = `
      <p class="tax-sim__total ${total > 0 ? "pos" : total < 0 ? "neg" : ""}">${fmtMe(total)} vuodessa</p>
      <p>${nf0.format(total / population)} € asukasta kohden.
      ${perPayer ? `Kunnallisveron muutos on keskimäärin ${nf0.format(perPayer)} € vuodessa verovelvollista kohden.` : ""}</p>
      <p class="tax-sim__note">Arvio on staattinen: veropohjan muutoksia, verotulojen tilitysviivettä ja valtionosuuksien verotuloihin perustuvaa tasausta ei ole huomioitu.</p>`;
      this.dispatchEvent(new CustomEvent("simulate", { detail: { effects, total } }));
    }
  };
  customElements.define("tax-simulator", TaxSimulator);

  // frontend/components/chart-export.js
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function svgToRaster(svg, type, scale = 2) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (type === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Kuvan muodostus epäonnistui")), type, 0.95);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  async function exportAs(format, source) {
    const name = source.filename || "kuvaaja";
    if (format === "csv") {
      download(new Blob(["\uFEFF" + source.getCSV()], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
      return;
    }
    const svg = source.getSVG();
    if (format === "svg") {
      download(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
      return;
    }
    const type = format === "jpg" ? "image/jpeg" : "image/png";
    download(await svgToRaster(svg, type), `${name}.${format}`);
  }
  function toCSV(header, rows) {
    const cell = (v) => {
      const s = v == null ? "" : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  }
  var ChartExport = class extends HTMLElement {
    connectedCallback() {
      this.classList.add("chart-export");
      this.innerHTML = ["png", "jpg", "svg", "csv"].map((f) => `<button type="button" data-format="${f}" title="Lataa ${f.toUpperCase()}">${f.toUpperCase()}</button>`).join("");
      this.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-format]");
        if (btn && this.source) exportAs(btn.dataset.format, this.source);
      });
    }
  };
  customElements.define("chart-export", ChartExport);

  // frontend/components/chart-base.js
  var FONT = "Century Gothic, CenturyGothic, AppleGothic, sans-serif";
  var INK = "#000000";
  var MUTED = "#595959";
  var GRID = "#E0E0E0";
  var PALETTE = ["#DE232F", "#FCB316", "#28336C", "#E64925", "#00ADC5", "#009651"];
  var POSITIVE = "#009651";
  var NEGATIVE = "#DE232F";
  var AXIS_LABEL = { fontFamily: FONT, fontWeight: "normal", color: INK, fontSize: 14 };
  var axisLabel = (compact) => compact ? { ...AXIS_LABEL, fontSize: 11 } : AXIS_LABEL;
  var axisName = (compact, extra = {}) => ({ fontFamily: FONT, color: MUTED, fontSize: compact ? 11 : 14, ...extra });
  var legendText = (compact) => ({ fontFamily: FONT, fontWeight: "normal", fontSize: compact ? 11 : 14, color: INK });
  function withAlpha(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${alpha})`;
  }
  var paletteColor = (i) => {
    const base = PALETTE[i % PALETTE.length];
    const round = Math.floor(i / PALETTE.length);
    return round ? withAlpha(base, Math.max(0.3, 1 - round * 0.35)) : base;
  };
  var SPLIT_LINE = { show: true, lineStyle: { type: "dashed", color: GRID, width: 1 } };
  function sliderZoom(extra = {}) {
    return {
      type: "slider",
      height: 18,
      bottom: 8,
      filterMode: "none",
      borderColor: "transparent",
      backgroundColor: "transparent",
      fillerColor: "rgba(222,35,47,0.10)",
      dataBackground: { lineStyle: { color: GRID }, areaStyle: { color: "transparent" } },
      handleStyle: { color: PALETTE[0] },
      textStyle: { color: MUTED, fontSize: 10 },
      ...extra
    };
  }
  var ChartBase = class extends HTMLElement {
    // Usage hint under the chart; subclasses may override.
    get hint() {
      return "Zoomaa hiiren rullalla tai alareunan liukusäätimellä.";
    }
    connectedCallback() {
      if (this.chart) return;
      this.compact = this.hasAttribute("compact");
      this.classList.add("chart");
      this.innerHTML = this.compact ? '<div class="chart__canvas"></div>' : `<chart-export></chart-export><div class="chart__canvas"></div><p class="chart__hint">${this.hint}</p>`;
      this.canvas = this.querySelector(".chart__canvas");
      this.chart = window.echarts.init(this.canvas, null, { renderer: "svg" });
      this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
      this.resizeObserver.observe(this.canvas);
      const exporter = this.querySelector("chart-export");
      if (exporter) {
        const self = this;
        exporter.source = {
          get filename() {
            return self.data?.filename;
          },
          getSVG: () => this.exportSVG(),
          getCSV: () => toCSV(this.data.csv.header, this.data.csv.rows)
        };
      }
      if (this.data) this.setData(this.data);
    }
    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.chart?.dispose();
      this.chart = null;
    }
    setData(data) {
      this.data = data;
      if (!this.chart) return;
      this.chart.setOption(this.buildOption(data, { compact: this.compact }), true);
    }
    // Current zoom window, so the export shows what the reader is looking at.
    currentZoom() {
      const dz = this.chart.getOption().dataZoom?.[0];
      return dz ? { startValue: dz.startValue, endValue: dz.endValue } : {};
    }
    // Size of the export: the chart's own size, or for a chart in a hidden tab
    // (PowerPoint export of the whole page) a default width and the CSS height.
    exportSize() {
      const width = this.canvas.clientWidth || 960;
      const height = this.canvas.clientHeight || parseFloat(getComputedStyle(this.canvas).height) || 420;
      return { width, height };
    }
    exportSVG() {
      const { width, height } = this.exportSize();
      const host = document.createElement("div");
      host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px`;
      document.body.appendChild(host);
      const chart = window.echarts.init(host, null, { renderer: "svg" });
      chart.setOption({
        ...this.buildOption(this.data, { exporting: true, zoom: this.currentZoom() }),
        animation: false
      });
      const svg = chart.renderToSVGString();
      chart.dispose();
      host.remove();
      return svg;
    }
  };

  // frontend/components/bar-chart.js
  var BarChart = class extends ChartBase {
    setData(data) {
      super.setData(data);
      const hint = this.querySelector(".chart__hint");
      if (hint) hint.hidden = Boolean(data.horizontal);
    }
    buildOption(data, { compact = false, exporting = false, zoom = {} } = {}) {
      const fmt = data.valueFormat || fmtInt;
      const showLegend = data.series.length > 1;
      const horizontal = Boolean(data.horizontal);
      const withSlider = !compact && !exporting && !horizontal;
      const categoryAxis = {
        type: "category",
        data: data.categories,
        inverse: horizontal,
        axisLine: { lineStyle: { color: INK } },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), hideOverlap: true }
      };
      const valueAxis = {
        type: "value",
        name: compact ? "" : data.yName || "",
        nameTextStyle: axisName(compact, { align: "left" }),
        splitNumber: compact ? 3 : 5,
        max: data.max,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
        splitLine: SPLIT_LINE
      };
      return {
        backgroundColor: "transparent",
        textStyle: { fontFamily: FONT, color: INK },
        animationDuration: 600,
        grid: {
          left: 4,
          // Room for the last value-axis label of horizontal bars.
          right: horizontal ? 24 : 8,
          top: showLegend ? 40 : 16,
          bottom: withSlider ? 64 : 8,
          containLabel: true
        },
        legend: {
          show: showLegend,
          top: 0,
          left: 0,
          icon: "roundRect",
          itemWidth: 12,
          itemHeight: 12,
          textStyle: legendText(compact)
        },
        tooltip: {
          show: !exporting,
          trigger: "axis",
          axisPointer: { type: "shadow", shadowStyle: { color: "rgba(0,0,0,0.04)" } },
          backgroundColor: "#fff",
          borderColor: GRID,
          textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
          valueFormatter: (v) => fmt(v)
        },
        // The unit of horizontal bars is in the chart subtitle.
        xAxis: horizontal ? { ...valueAxis, name: "" } : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxis,
        dataZoom: compact || horizontal ? [] : [
          { type: "inside", ...exporting ? zoom : {} },
          ...withSlider ? [sliderZoom()] : []
        ],
        series: data.series.map((s, i) => {
          const color = s.color || paletteColor(i);
          return {
            name: s.name,
            type: "bar",
            barMaxWidth: 28,
            stack: data.stack ? "total" : void 0,
            data: data.signColors ? s.values.map((v) => ({ value: v, itemStyle: { color: v < 0 ? NEGATIVE : POSITIVE } })) : s.values,
            itemStyle: { color }
          };
        })
      };
    }
  };
  customElements.define("bar-chart", BarChart);

  // frontend/functions/search-index.js
  var search_index_default = [
    {
      "href": "index.html",
      "title": "Etusivu",
      "page": "Etusivu",
      "description": "Kuntatalouden tasapainotus: kokonaistalous, palveluluokat, verotus ja toimenpiteet verrokkikuntiin ja kokoluokan parhaisiin verrattuna.",
      "keywords": "etusivu tasapaino tilannekuva avainluvut verrokit kokoluokka parhaat kunnat toimenpiteet",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html",
      "title": "Kokonaistalous",
      "page": "Kokonaistalous",
      "description": "Talouden tasapaino kuntatalouden avainluvuilla: tulorahoituksen riittävyys, rahavirrat, velka ja kuntakonserni.",
      "keywords": "tasapaino kokonaistalous avainluvut vuosikate poistot rahavirta lainakanta konserni tytäryhteisöt liikelaitokset TOLT talousarvio Tasapainon tila",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#tila",
      "title": "Tasapainon tila",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "avainluvut tilannekuva kriisikunta arviointimenettely",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#rahavirta",
      "title": "Toiminnan ja investointien rahavirta",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "rahavirta investoinnit luovutustulot rahoitusosuudet satunnaiset erät kassavarat lainanotto",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#vuosikate",
      "title": "Vuosikate",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#vuosikate-poistot",
      "title": "Vuosikate prosenttia poistoista",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#tulos",
      "title": "Tilikauden ylijäämä (alijäämä)",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#kertynyt",
      "title": "Kertynyt ylijäämä (alijäämä)",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#lainakanta",
      "title": "Lainakanta",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "velka lainat korollinen vieras pääoma korkokulut",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#toimintakate",
      "title": "Toimintakate",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#konserni",
      "title": "Kuntakonserni",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "konserni konsernitilinpäätös KKOTR tytäryhteisöt kuntayhtymät",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#tolt",
      "title": "Tytäryhteisöt, osakkuusyhteisöt ja liikelaitokset",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "TOLT TOLTA TOLTB tytäryhteisöt osakkuusyhteisöt liikelaitokset vesihuolto taseyksiköt",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#talousarvio",
      "title": "Talousarvio, taloussuunnitelma ja tilinpäätösennuste",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "KTAS KTPE talousarvio taloussuunnitelma tilinpäätösennuste investointisuunnitelma",
      "upcoming": false
    },
    {
      "href": "kokonaistalous.html#kehitys",
      "title": "Kehitysehdotukset",
      "page": "Kokonaistalous",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html",
      "title": "Ulkoiset tulot ja menot palveluluokittain",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "Ulkoiset tulot ja menot euroa asukasta kohden palveluluokittain ja tileittäin, lakisääteisyys sekä ostolaskut.",
      "keywords": "palveluluokat ulkoiset menot tulot tileittäin lakisääteiset tehtävät opetus ostolaskut toimittajat KKTPP TOTT Ulkoiset toimintakulut palveluluokittain",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#menot",
      "title": "Ulkoiset toimintakulut palveluluokittain",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "toimintakulut menot palveluluokka",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#tulot",
      "title": "Ulkoiset toimintatuotot palveluluokittain",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "toimintatuotot maksutuotot myyntituotot tulot palveluluokka",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#lakisaateiset",
      "title": "Erot keskiarvoon lakisääteisyyden mukaan",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "lakisääteiset tehtävät vapaaehtoiset tehtävät säästökohteet VM",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#kulurakenne",
      "title": "Toimintakulut tileittäin",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "henkilöstökulut palvelujen ostot asiakaspalvelujen ostot aineet avustukset tilit",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#tulorakenne",
      "title": "Toimintatuotot tileittäin",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "myyntituotot maksutuotot vuokratuotot tuet avustukset tilit",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#henkilosto",
      "title": "Henkilöstökulut",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#opetus",
      "title": "Esi-, perus- ja lukio-opetuksen kustannukset",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "TOTT esiopetus perusopetus lukio oppilas kustannus",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#ostolaskut",
      "title": "Ostolaskut 2023–2025",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "ostolaskut hankinnat ostot pienlaskut",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#toimittajat",
      "title": "Suurimmat toimittajat",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "toimittajat hankinnat kilpailutus",
      "upcoming": false
    },
    {
      "href": "palveluluokat.html#yhteiset",
      "title": "Yhteiset toimittajat",
      "page": "Ulkoiset tulot ja menot palveluluokittain",
      "description": "",
      "keywords": "yhteishankinta toimittajat kilpailutus",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html",
      "title": "Tasapainotusohjelman toimenpiteet",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "Viisi näkökulmaa ja kunkin viisi tärkeintä nostoa: palveluverkko, toimintakulut ja tuotanto, investoinnit ja kiinteistöt, tulojen vahvistaminen sekä jokeri.",
      "keywords": "tasapainotusohjelma toimenpiteet säästöt sopeutus palveluverkko investoinnit kiinteistöt tulot jokeri tekoäly Palveluverkko",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html#palveluverkko",
      "title": "Palveluverkko",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "",
      "keywords": "kouluverkko päiväkodit toimipisteet yhdistäminen",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html#toimintakulut",
      "title": "Toimintakulut ja tuotanto",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "",
      "keywords": "tehostaminen henkilöstö ostopalvelut hankinnat",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html#investoinnit",
      "title": "Investoinnit ja kiinteistöt",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "",
      "keywords": "investoinnit kiinteistöt omaisuuden myynti metsät",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html#tulot",
      "title": "Tulojen vahvistaminen",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "",
      "keywords": "veroprosentti maksut tulolähteet kiinteistövero",
      "upcoming": false
    },
    {
      "href": "toimenpiteet.html#jokeri",
      "title": "Jokeri: tekoäly ja automaatio",
      "page": "Tasapainotusohjelman toimenpiteet",
      "description": "",
      "keywords": "jokeri tekoäly automaatio robotiikka data ostolaskut",
      "upcoming": false
    },
    {
      "href": "verotus.html",
      "title": "Verotus",
      "page": "Verotus",
      "description": "Veroasteet, verotulot ja veropohja verrattuna verrokkeihin, sekä veroprosenttien muutosten vaikutukset.",
      "keywords": "verotus veroprosentti efektiivinen veroaste kunnallisvero kiinteistövero yhteisövero valtionosuudet ansiotulot simulaattori Efektiivinen veroaste",
      "upcoming": false
    },
    {
      "href": "verotus.html#efektiivinen",
      "title": "Efektiivinen veroaste",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#suhde",
      "title": "Efektiivisen ja nimellisen veroasteen suhde",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#nimellinen",
      "title": "Tuloveroprosentti",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#kunnallisvero",
      "title": "Kunnallisveron tuotto",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#kiinteistovero",
      "title": "Kiinteistöveron tuotto",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#yhteisovero",
      "title": "Yhteisöveron tuotto",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#valtionosuudet",
      "title": "Valtionosuudet",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#ansiotulot",
      "title": "Veronalaiset ansiotulot",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#tuotot-kulut",
      "title": "Toimintatuotot suhteessa toimintakuluihin",
      "page": "Verotus",
      "description": "",
      "keywords": "",
      "upcoming": false
    },
    {
      "href": "verotus.html#simulaattori",
      "title": "Veroprosenttisimulaattori",
      "page": "Verotus",
      "description": "",
      "keywords": "simulaattori veroprosentin korotus kiinteistöveroprosentti laskuri",
      "upcoming": false
    }
  ];

  // frontend/functions/search.js
  function normalize(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  var words = (s) => normalize(s).split(" ").filter(Boolean);
  function tokenScore(token, fields) {
    let best = 0;
    for (const { words: w, weight } of fields) {
      if (weight > best && w.some((word) => word.startsWith(token))) best = weight;
    }
    return best;
  }
  function prepare(index) {
    return index.map((entry) => ({
      entry,
      fields: [
        { words: words(entry.title), weight: 3 },
        { words: words(entry.keywords), weight: 2 },
        { words: words(`${entry.page} ${entry.description}`), weight: 1 }
      ]
    }));
  }
  var prepared;
  var preparedFor;
  function namedMunicipality(query, municipalities) {
    const q = ` ${normalize(query)} `;
    let found = null;
    for (const m of municipalities) {
      const name = normalize(m.name);
      if (q.includes(` ${name} `) && (!found || name.length > normalize(found.name).length)) found = m;
    }
    return found;
  }
  function search(query, index, municipalities = [], { limit = 8, municipalityLimit = 5 } = {}) {
    if (preparedFor !== index) {
      prepared = prepare(index);
      preparedFor = index;
    }
    const municipality = namedMunicipality(query, municipalities);
    let tokens = words(query);
    if (municipality) {
      const nameWords = words(municipality.name);
      tokens = tokens.filter((t) => !nameWords.includes(t));
    }
    const queryWords = words(query).filter((t) => t.length >= 2);
    const municipalityHits = municipalities.filter((m) => m === municipality || words(m.name).some((w) => queryWords.some((t) => w.startsWith(t)))).sort((a, b) => a === municipality ? -1 : b === municipality ? 1 : a.name.localeCompare(b.name, "fi")).slice(0, municipalityLimit);
    let pages;
    if (!tokens.length) {
      pages = municipality ? prepared.filter((p) => !p.entry.href.includes("#")).map((p) => ({ ...p, score: 0 })) : [];
    } else {
      pages = prepared.map((p) => {
        const scores = tokens.map((t) => tokenScore(t, p.fields));
        return { ...p, score: scores.every((s) => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 };
      }).filter((p) => p.score > 0);
    }
    pages.sort((a, b) => a.entry.upcoming - b.entry.upcoming || b.score - a.score || a.entry.href.localeCompare(b.entry.href));
    return {
      municipality,
      municipalities: municipalityHits,
      pages: pages.slice(0, limit).map((p) => p.entry)
    };
  }

  // frontend/functions/paths.js
  var PAGES = "/frontend/pages/";
  function rootUrl() {
    const url = new URL(".", location.href);
    const i = url.pathname.lastIndexOf(PAGES);
    if (i >= 0) url.pathname = url.pathname.slice(0, i + 1);
    return url;
  }
  var ROOT = rootUrl().href;
  function asset(path) {
    return new URL(`frontend/${path}`, ROOT).href;
  }
  function dataAsset(path) {
    return new URL(`backend/${path}`, ROOT).href;
  }
  function pageUrl(name) {
    const [file, hash] = name.split("#");
    const url = new URL(file === "index.html" ? "index.html" : `frontend/pages/${file}`, ROOT);
    if (hash) url.hash = hash;
    return url.href;
  }
  var isFileProtocol = () => location.protocol === "file:";

  // frontend/functions/data.js
  function loadDataScript(path) {
    return new Promise((resolve, reject) => {
      const cached = window.KUNTATIETO_DATA?.[path];
      if (cached) return resolve(cached);
      const script = document.createElement("script");
      script.src = dataAsset(path.replace(/\.json$/, ".js"));
      script.onload = () => {
        const data = window.KUNTATIETO_DATA?.[path];
        if (data) resolve(data);
        else reject(new Error(`Ei dataa: ${path}`));
      };
      script.onerror = () => reject(new Error(`Ei dataa: ${path}`));
      document.head.appendChild(script);
    });
  }
  var cache = /* @__PURE__ */ new Map();
  function loadDataFile(path) {
    if (!cache.has(path)) {
      cache.set(path, (async () => {
        if (isFileProtocol()) return loadDataScript(path);
        const res = await fetch(dataAsset(path));
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
        return res.json();
      })());
    }
    return cache.get(path);
  }
  var loadMunicipalities = () => loadDataFile("data/kunnat.json");
  var loadComparison = () => loadDataFile("data/tasapaino/vertailu.json");
  var loadIncomeTax = () => loadDataFile("data/tax/tuloverot.json");
  var loadPropertyTax = () => loadDataFile("data/tax/kiinteistovero.json");
  var loadTaxRates = () => loadDataFile("data/tax/veroprosentit.json");

  // frontend/functions/municipality.js
  var STORAGE_KEY = "kuntatieto.kunta";
  var DEFAULT_SLUG = "kangasala";
  var CHANGE_EVENT = "kunta-change";
  function readStorage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
  function writeStorage(slug2) {
    try {
      localStorage.setItem(STORAGE_KEY, slug2);
    } catch {
    }
  }
  function getSelectedSlug() {
    const fromUrl = new URLSearchParams(location.search).get("kunta");
    return fromUrl || readStorage() || DEFAULT_SLUG;
  }
  function setSelectedSlug(slug2) {
    writeStorage(slug2);
    const url = new URL(location.href);
    url.searchParams.set("kunta", slug2);
    history.replaceState(null, "", url);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { slug: slug2 } }));
  }
  function onMunicipalityChange(callback) {
    window.addEventListener(CHANGE_EVENT, (e) => callback(e.detail.slug));
  }
  function withKunta(href, slug2 = getSelectedSlug()) {
    const [path] = href.split("?");
    return `${pageUrl(path)}?kunta=${encodeURIComponent(slug2)}`;
  }

  // frontend/components/site-search.js
  var ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';
  function link(href, slug2) {
    const [path, hash] = href.split("#");
    return withKunta(path, slug2) + (hash ? `#${hash}` : "");
  }
  var SiteSearch = class extends HTMLElement {
    connectedCallback() {
      if (this.toggle) return;
      this.innerHTML = `
      <button type="button" class="site-search__toggle" aria-expanded="false" aria-controls="site-search-panel">
        ${ICON}<span class="site-search__toggle-label">Haku</span>
      </button>
      <div id="site-search-panel" class="site-search__panel" hidden>
        <div class="container">
          <form class="site-search__form" role="search">
            <label for="site-search-input" class="visually-hidden">Hae sivustolta</label>
            <input id="site-search-input" type="search" autocomplete="off"
              placeholder="Hae sivustolta, esim. vuosikate, kiinteistövero tai Nokia verotus">
            <button type="button" class="site-search__close" aria-label="Sulje haku">Sulje</button>
          </form>
          <p class="site-search__status" aria-live="polite"></p>
          <div class="site-search__results"></div>
        </div>
      </div>`;
      this.toggle = this.querySelector(".site-search__toggle");
      this.panel = this.querySelector(".site-search__panel");
      this.input = this.querySelector("input");
      this.status = this.querySelector(".site-search__status");
      this.results = this.querySelector(".site-search__results");
      this.toggle.addEventListener("click", () => this.panel.hidden ? this.open() : this.close());
      this.querySelector(".site-search__close").addEventListener("click", () => this.close(true));
      this.input.addEventListener("input", () => this.update());
      this.results.addEventListener("click", (e) => {
        if (e.target.closest("a")) this.close();
      });
      this.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const first = this.results.querySelector("a");
        if (first) location.href = first.href;
      });
      this.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !this.panel.hidden) this.close(true);
      });
      this.onDocumentClick = (e) => {
        if (!this.panel.hidden && !this.contains(e.target)) this.close();
      };
      document.addEventListener("click", this.onDocumentClick);
    }
    disconnectedCallback() {
      document.removeEventListener("click", this.onDocumentClick);
    }
    async open() {
      this.panel.hidden = false;
      this.toggle.setAttribute("aria-expanded", "true");
      this.input.focus();
      this.municipalities || (this.municipalities = await loadMunicipalities().catch(() => []));
      this.update();
    }
    close(returnFocus = false) {
      this.panel.hidden = true;
      this.toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) this.toggle.focus();
    }
    update() {
      const query = this.input.value.trim();
      if (!query) {
        this.status.textContent = "";
        this.results.innerHTML = "";
        return;
      }
      const r = search(query, search_index_default, this.municipalities || []);
      const slug2 = r.municipality?.slug || getSelectedSlug();
      const count = r.pages.length + r.municipalities.length;
      this.status.textContent = count ? `${count} tulosta` + (r.municipality ? `, kunta: ${r.municipality.name}` : "") : `Ei tuloksia haulle ”${query}”.`;
      const pageItems = r.pages.map((p) => `
      <li><a href="${escapeHtml(link(p.href, slug2))}">
        <span class="site-search__title">${escapeHtml(p.title)}</span>
        <span class="site-search__meta">${escapeHtml(p.upcoming ? `${p.page} · sisältö tulossa` : p.href.includes("#") ? p.page : p.description || p.page)}</span>
      </a></li>`).join("");
      const municipalityItems = r.municipalities.map((m) => `
      <li><a href="${escapeHtml(link("index.html", m.slug))}">
        <span class="site-search__title">${escapeHtml(m.name)}</span>
        <span class="site-search__meta">Kunnan etusivu</span>
      </a></li>`).join("");
      this.results.innerHTML = (pageItems ? `<h2 class="site-search__group">Sivut</h2><ul>${pageItems}</ul>` : "") + (municipalityItems ? `<h2 class="site-search__group">Kunnat</h2><ul>${municipalityItems}</ul>` : "");
    }
  };
  customElements.define("site-search", SiteSearch);

  // frontend/components/site-header.js
  var NAV_ITEMS = [
    { id: "kokonaistalous", label: "Kokonaistalous", href: "kokonaistalous.html" },
    { id: "palveluluokat", label: "Palveluluokat", href: "palveluluokat.html" },
    { id: "verotus", label: "Verotus", href: "verotus.html" },
    { id: "toimenpiteet", label: "Toimenpiteet", href: "toimenpiteet.html" }
  ];
  var SiteHeader = class extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute("active");
      this.innerHTML = `
      <header class="site-header">
        <div class="site-header__bar container">
          <a class="site-header__logo" data-href="index.html" href="index.html" aria-label="Etusivu">
            <span class="site-header__title">Tasapaino</span>
          </a>
          <label class="kunta-select">
            <span class="kunta-select__label">Kunta</span>
            <select aria-label="Valitse kunta"><option>Ladataan…</option></select>
          </label>
          <site-search></site-search>
          <button class="site-header__toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Valikko">
            <span></span><span></span><span></span>
          </button>
        </div>
        <nav id="site-nav" class="site-nav">
          <ul class="container">
            ${NAV_ITEMS.map((item) => `
              <li><a data-href="${item.href}" href="${item.href}"${item.id === active ? ' aria-current="page"' : ""}>${item.label}</a></li>
            `).join("")}
          </ul>
        </nav>
      </header>`;
      const toggle = this.querySelector(".site-header__toggle");
      const nav = this.querySelector(".site-nav");
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
      });
      this.select = this.querySelector("select");
      this.select.addEventListener("change", () => setSelectedSlug(this.select.value));
      onMunicipalityChange(() => this.updateLinks());
      this.updateLinks();
      this.populate();
    }
    async populate() {
      const list = await loadMunicipalities();
      const selected = getSelectedSlug();
      this.select.innerHTML = list.map((m) => `<option value="${m.slug}"${m.slug === selected ? " selected" : ""}>${escapeHtml(m.name)}</option>`).join("");
    }
    updateLinks() {
      const slug2 = getSelectedSlug();
      this.querySelectorAll("a[data-href]").forEach((a) => {
        a.href = withKunta(a.dataset.href, slug2);
      });
    }
  };
  customElements.define("site-header", SiteHeader);

  // frontend/components/site-footer.js
  var LOGO = asset("brand/logos/Kangasala_logo_RGB_white.svg");
  var ICONS = {
    linkedin: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
    instagram: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
    facebook: "M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z"
  };
  var LINKS = [
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/kangasalan-kaupunki" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/kangasalankaupunki/" },
    { id: "facebook", label: "Facebook", href: "https://www.facebook.com/kangasalankaupunki" }
  ];
  var SiteFooter = class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
      <footer class="site-footer">
        <div class="container site-footer__inner">
          <img class="site-footer__logo" src="${LOGO}" alt="Kangasala" width="140" height="34">
          <div class="site-footer__share">
            <span class="site-footer__label">Seuraa meitä</span>
            <ul class="social">
              ${LINKS.map((s) => `
                <li><a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${ICONS[s.id]}"/></svg>
                </a></li>`).join("")}
            </ul>
          </div>
        </div>
        <div class="container site-footer__meta">Lähteet: Valtiokonttori (tutkihallintoa.fi), Verohallinto, Kuntaliitto, Tilastokeskus sekä kuntien julkaisemat ostolaskut. Tilinpäätöstiedot ovat ulkoisia eriä.</div>
      </footer>`;
    }
  };
  customElements.define("site-footer", SiteFooter);

  // frontend/components/site-submenu.js
  var STEPS = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 };
  var LIST_AFTER = 8;
  var SiteSubmenu = class extends HTMLElement {
    connectedCallback() {
      if (this.nav) return;
      this.articles = [...this.querySelectorAll(":scope > article[data-tab]")];
      this.groups = [...new Set(this.articles.map((a) => a.dataset.group).filter(Boolean))];
      this.lastInGroup = /* @__PURE__ */ new Map();
      const label = escapeHtml(this.getAttribute("label") || "Artikkelit");
      this.nav = document.createElement("nav");
      this.nav.className = "submenu";
      this.nav.setAttribute("aria-label", this.getAttribute("label") || "Artikkelit");
      this.nav.innerHTML = (this.groups.length ? `<ul class="submenu__groups" role="tablist" aria-label="${label}: aiheet"></ul>` : "") + `<ul class="submenu__tabs" role="tablist" aria-label="${label}"></ul>`;
      this.groupList = this.nav.querySelector(".submenu__groups");
      this.tabList = this.nav.querySelector(".submenu__tabs");
      this.groupLinks = this.groups.map((group, i) => {
        const first = this.articles.find((a) => a.dataset.group === group);
        const link2 = this.createTab(`${this.id || "submenu"}-group-${i}`, group, first.id);
        link2.addEventListener("click", (e) => {
          e.preventDefault();
          this.select(this.lastInGroup.get(group) || first.id, { updateUrl: true });
        });
        this.groupList.append(link2.parentElement);
        return link2;
      });
      this.tabLinks = this.articles.map((article) => {
        const link2 = this.createTab(`${article.id}-tab`, article.dataset.tab, article.id);
        link2.setAttribute("aria-controls", article.id);
        article.setAttribute("role", "tabpanel");
        article.setAttribute("aria-labelledby", link2.id);
        link2.addEventListener("click", (e) => {
          e.preventDefault();
          this.select(article.id, { updateUrl: true });
        });
        this.tabList.append(link2.parentElement);
        return link2;
      });
      this.groupList?.addEventListener("keydown", (e) => this.onKey(e, this.groupLinks.filter((l) => !l.hidden)));
      this.tabList.addEventListener("keydown", (e) => this.onKey(e, this.tabLinks.filter((l) => !l.parentElement.hidden)));
      this.prepend(this.nav);
      this.select(this.fromHash() || this.articles[0]?.id);
      window.addEventListener("hashchange", () => {
        const id = this.fromHash();
        if (id) this.select(id);
      });
    }
    createTab(id, text2, target) {
      const li = document.createElement("li");
      li.setAttribute("role", "presentation");
      const link2 = document.createElement("a");
      link2.id = id;
      link2.href = `#${target}`;
      link2.setAttribute("role", "tab");
      link2.textContent = text2;
      li.append(link2);
      return link2;
    }
    onKey(e, links) {
      const i = links.indexOf(document.activeElement);
      if (i < 0) return;
      let next;
      const vertical = e.key === "ArrowDown" || e.key === "ArrowUp";
      if (vertical && !e.currentTarget.classList.contains("submenu__tabs--list")) return;
      if (e.key in STEPS) next = links[(i + STEPS[e.key] + links.length) % links.length];
      else if (e.key === "Home") next = links[0];
      else if (e.key === "End") next = links.at(-1);
      else return;
      e.preventDefault();
      next.click();
      (links.find((l) => l.getAttribute("aria-selected") === "true") || next).focus();
    }
    // A row for a few tabs, a two-column link list for many. The list fills the
    // left column first, so the order reads from top to bottom.
    layoutTabs() {
      const visible = this.tabLinks.filter((l) => !l.parentElement.hidden).length;
      const limit = Number(this.getAttribute("list-after")) || LIST_AFTER;
      const list = visible > limit;
      this.tabList.classList.toggle("submenu__tabs--list", list);
      this.tabList.setAttribute("aria-orientation", list ? "vertical" : "horizontal");
      this.tabList.style.setProperty("--submenu-rows", list ? String(Math.ceil(visible / 2)) : "");
    }
    get selected() {
      return this.current;
    }
    // Article that contains the element named by the URL hash.
    fromHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id && document.getElementById(id);
      return target ? this.articles.find((a) => a.contains(target))?.id ?? null : null;
    }
    select(id, { updateUrl = false } = {}) {
      const selected = this.articles.find((a) => a.id === id);
      if (!selected) return;
      const group = selected.dataset.group;
      if (group) this.lastInGroup.set(group, id);
      this.groupLinks.forEach((link2, i) => {
        const on = this.groups[i] === group;
        link2.setAttribute("aria-selected", String(on));
        link2.tabIndex = on ? 0 : -1;
      });
      this.articles.forEach((article, i) => {
        const on = article === selected;
        const link2 = this.tabLinks[i];
        article.hidden = !on;
        link2.parentElement.hidden = Boolean(group) && article.dataset.group !== group;
        link2.setAttribute("aria-selected", String(on));
        link2.tabIndex = on ? 0 : -1;
      });
      this.layoutTabs();
      if (updateUrl) {
        const url = new URL(location.href);
        url.hash = id;
        history.replaceState(null, "", url);
      }
      if (id !== this.current) {
        this.current = id;
        this.dispatchEvent(new CustomEvent("tab-change", { detail: { id } }));
      }
    }
  };
  customElements.define("site-submenu", SiteSubmenu);

  // frontend/components/share-button.js
  var ICON2 = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M18 16.1c-.8 0-1.4.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9-1.2-2.9-2.8-2.9z" fill="currentColor"/></svg>';
  var ShareButton = class extends HTMLElement {
    connectedCallback() {
      this.classList.add("share");
      this.innerHTML = `
      <button type="button" class="share__toggle" aria-expanded="false">${ICON2}<span>Jaa artikkeli</span></button>
      <div class="share__panel" hidden>
        <label class="share__label" for="share-${this.target}">Linkki artikkeliin</label>
        <div class="share__row">
          <input id="share-${this.target}" class="share__url" type="text" readonly>
          <button type="button" class="share__copy">Kopioi</button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>`;
      this.toggle = this.querySelector(".share__toggle");
      this.panel = this.querySelector(".share__panel");
      this.input = this.querySelector(".share__url");
      this.status = this.querySelector(".share__status");
      this.toggle.addEventListener("click", () => this.setOpen(this.panel.hidden));
      this.querySelector(".share__copy").addEventListener("click", () => this.copy());
      this.input.addEventListener("focus", () => this.input.select());
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.setOpen(false);
      });
    }
    get target() {
      return this.getAttribute("target") || "";
    }
    url() {
      const url = new URL(location.href);
      url.searchParams.set("kunta", getSelectedSlug());
      url.hash = this.target;
      return url.toString();
    }
    setOpen(open) {
      this.panel.hidden = !open;
      this.toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        this.input.value = this.url();
        this.status.textContent = "";
      }
    }
    async copy() {
      this.input.value = this.url();
      try {
        await navigator.clipboard.writeText(this.input.value);
      } catch {
        this.input.select();
        document.execCommand("copy");
      }
      this.status.textContent = "Linkki kopioitu leikepöydälle.";
    }
  };
  customElements.define("share-button", ShareButton);

  // frontend/functions/pptx-deck.js
  var LIB = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
  var FONT2 = "Century Gothic";
  var RED = "DE232F";
  var TITLE_RED = "E01F27";
  var INK2 = "000000";
  var MUTED2 = "595959";
  var BRAND = "Tasapaino – kuntatalouden tasapainotus";
  var bg = (name) => ({ path: asset(`brand/photos/powerpoint/${name}.jpg`) });
  var pick = (list) => list[Math.floor(Math.random() * list.length)];
  var SUBTITLE_BGS = [
    { name: "head_blue_bg", color: "FFFFFF" },
    { name: "head_cyan_bg", color: "FFFFFF" },
    { name: "head_grey_bg", color: "FFFFFF" },
    { name: "head_orange_bg", color: "FFFFFF" },
    { name: "head_yellow_bg", color: INK2 }
  ];
  var LAST_BGS = [1, 2, 3, 4, 5, 6].map((i) => `head_pic_${i}_bg`);
  var libPromise;
  function loadLibrary() {
    libPromise || (libPromise = new Promise((resolve, reject) => {
      if (window.PptxGenJS) return resolve(window.PptxGenJS);
      const script = document.createElement("script");
      script.src = LIB;
      script.onload = () => resolve(window.PptxGenJS);
      script.onerror = () => {
        libPromise = null;
        reject(new Error("PowerPoint-kirjaston lataus epäonnistui"));
      };
      document.head.appendChild(script);
    }));
    return libPromise;
  }
  var text = (el) => el?.textContent.replace(/\s+/g, " ").trim() ?? "";
  function isShown(el, article) {
    for (let n = el; n && n !== article; n = n.parentElement) {
      if (n.hidden || n.tagName === "DETAILS") return false;
    }
    return true;
  }
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  async function chartImage(chart) {
    const { width, height } = chart.exportSize();
    const png = await svgToRaster(chart.exportSVG(), "image/png");
    return { data: (await blobToDataUrl(png)).replace(/^data:/, ""), ratio: width / height };
  }
  async function collectTheme(article) {
    const byEnd = (suffix) => article.querySelector(`[id$="-${suffix}"]`);
    const charts = [];
    for (const el of article.querySelectorAll(".chart")) {
      if (!el.data || typeof el.exportSVG !== "function" || el.compact || !isShown(el, article)) continue;
      const figure = el.closest(".figure");
      charts.push({
        title: text(figure?.querySelector(".figure__title")),
        subtitle: text(figure?.querySelector(".figure__subtitle")),
        source: text(figure?.querySelector(".figure__source")),
        image: await chartImage(el)
      });
    }
    const analysisEl = byEnd("analysis");
    const analysis = analysisEl ? [...analysisEl.querySelectorAll("p, li")].map(text).filter(Boolean) : [];
    if (analysisEl && !analysis.length && text(analysisEl)) analysis.push(text(analysisEl));
    const tables = [...article.querySelectorAll("data-table")].filter((t) => t.data && isShown(t, article)).map((t) => ({ ...t.data, rows: t.sortedRows() }));
    return {
      tab: article.dataset.tab || "",
      kicker: text(byEnd("kicker")),
      title: text(article.querySelector("h1")),
      standfirst: text(byEnd("standfirst")),
      meta: text(byEnd("meta")),
      charts,
      analysis,
      summary: [...article.querySelectorAll(".summary-box p")].map(text).filter(Boolean).join(" "),
      tables
    };
  }
  function fit(ratio, x, y, w, h) {
    const width = Math.min(w, h * ratio);
    const height = width / ratio;
    return { x: x + (w - width) / 2, y: y + (h - height) / 2, w: width, h: height };
  }
  function chunk(paragraphs2, budget) {
    const pieces = paragraphs2.flatMap((p) => {
      if (p.length <= budget) return [p];
      const out = [];
      let cur2 = "";
      for (const s of p.match(/[^.!?]+[.!?]*\s*/g) ?? [p]) {
        if (cur2 && (cur2 + s).length > budget) {
          out.push(cur2.trim());
          cur2 = "";
        }
        cur2 += s;
      }
      if (cur2.trim()) out.push(cur2.trim());
      return out;
    });
    const groups = [];
    let cur = [];
    let len = 0;
    for (const p of pieces) {
      if (cur.length && len + p.length > budget) {
        groups.push(cur);
        cur = [];
        len = 0;
      }
      cur.push(p);
      len += p.length + 40;
    }
    if (cur.length) groups.push(cur);
    return groups;
  }
  var paragraphRuns = (list, options = {}) => list.map((p, i) => ({
    text: p,
    options: { breakLine: i < list.length - 1, paraSpaceAfter: 8, ...options }
  }));
  function footer(slide, source, color = MUTED2, x = 0.6) {
    slide.addText(`${source ? `${source} · ` : ""}${BRAND}`, {
      x,
      y: 6.85,
      w: 10.6 - x,
      h: 0.5,
      fontFace: FONT2,
      fontSize: 10,
      color,
      valign: "middle"
    });
  }
  var lines = (str, width, size) => Math.max(1, Math.ceil(str.length / (width / (size / 72 * 0.52))));
  function shortTitle(str, max = 80) {
    let t = (str || "").split(/\.\s+(?=[A-ZÄÖÅ])/)[0].replace(/\s*\([^)]*\)/g, "").trim();
    if (t.length > max) t = `${t.slice(0, t.lastIndexOf(" ", max))} …`;
    return t;
  }
  function titleSlide(pptx, { label, theme }) {
    const slide = pptx.addSlide();
    slide.background = bg("front_bg_red");
    const x = 2.4;
    const w = 10.5;
    slide.addText(label, { x, y: 1.45, w, h: 0.4, fontFace: FONT2, fontSize: 16, color: "FFFFFF" });
    const titleH = Math.min(3.2, lines(theme.title, w, 48) * 0.78 + 0.1);
    slide.addText(theme.title, {
      x,
      y: 1.85,
      w,
      h: titleH,
      fontFace: FONT2,
      fontSize: 48,
      color: "FFFFFF",
      valign: "top",
      margin: 0
    });
    const top = 1.85 + titleH + 0.2;
    const height = 6.8 - top;
    const chart = theme.charts[0];
    if (chart && height >= 1.5) {
      slide.addShape(pptx.ShapeType.rect, { x, y: top, w, h: height, fill: { color: "FFFFFF" }, line: { color: "FFFFFF" } });
      slide.addImage({ data: chart.image.data, ...fit(chart.image.ratio, x + 0.1, top + 0.1, w - 0.2, height - 0.2) });
    } else if (theme.standfirst && height >= 1) {
      slide.addText(theme.standfirst, { x, y: top, w, h: height, fontFace: FONT2, fontSize: 20, color: "FFFFFF", valign: "top" });
    }
    footer(slide, (chart?.source || theme.meta).split(/\.\s+(?=[A-ZÄÖÅ])/)[0], "FFFFFF", x);
  }
  function subtitleSlide(pptx, theme) {
    const { name, color } = pick(SUBTITLE_BGS);
    const slide = pptx.addSlide();
    slide.background = bg(name);
    slide.addText(theme.tab || theme.kicker, {
      x: 0.8,
      y: 1.6,
      w: 8.2,
      h: 2.2,
      fontFace: FONT2,
      fontSize: 40,
      color,
      valign: "bottom",
      fit: "shrink"
    });
    slide.addText(theme.title, {
      x: 0.8,
      y: 4,
      w: 8.2,
      h: 1.8,
      fontFace: FONT2,
      fontSize: 20,
      color,
      valign: "top",
      fit: "shrink"
    });
  }
  function contentSlide(pptx, title) {
    const slide = pptx.addSlide();
    slide.background = bg("txt_bg_white");
    slide.addText(title, {
      x: 0.6,
      y: 0.35,
      w: 11.4,
      h: 1.45,
      fontFace: FONT2,
      fontSize: 36,
      color: TITLE_RED,
      valign: "top",
      fit: "shrink"
    });
    return slide;
  }
  var BODY = { fontFace: FONT2, fontSize: 16, color: INK2, valign: "top" };
  function chartSlide(pptx, theme, chart, i) {
    const slide = contentSlide(pptx, i === 0 ? theme.title : chart.title || theme.title);
    const side = i === 0 && theme.summary ? [{ text: "Yhteenveto", options: { bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: theme.summary }] : [{ text: chart.title, options: { bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: chart.subtitle }];
    slide.addImage({ data: chart.image.data, ...fit(chart.image.ratio, 0.6, 1.95, 8, 4.85) });
    slide.addText(side, { x: 8.9, y: 1.95, w: 3.9, h: 4.85, ...BODY });
    footer(slide, chart.source || theme.meta);
  }
  var MAX_ROWS = 13;
  var MAX_TABLE_SLIDES = 2;
  function tableRows(table, rows) {
    const header = table.columns.map((c, i) => ({
      text: c.label,
      options: { bold: true, fill: { color: "F3F3F3" }, align: i === 0 ? "left" : "center" }
    }));
    const body = rows.map((row) => {
      const strong = table.highlight?.(row);
      return table.columns.map((c, i) => {
        const value = row[c.key];
        const color = c.signColor && typeof value === "number" ? value > 0 ? "009651" : value < 0 ? RED : INK2 : INK2;
        return {
          text: String(c.format ? c.format(value, row) : value ?? ""),
          options: { color, bold: Boolean(strong), align: i === 0 ? "left" : "center", ...strong && { fill: { color: "F3F3F3" } } }
        };
      });
    });
    return [header, ...body];
  }
  function columnWidths(table, width) {
    const weights = table.columns.map((c) => c.numeric ? 1 : 2);
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((v) => v / total * width);
  }
  function addTable(slide, table, rows, box) {
    slide.addTable(tableRows(table, rows), {
      ...box,
      colW: columnWidths(table, box.w),
      fontFace: FONT2,
      fontSize: 11,
      color: INK2,
      rowH: 0.3,
      margin: 0.04,
      border: { type: "solid", pt: 0.5, color: "E0E0E0" },
      autoPage: false
    });
  }
  function analysisSlides(pptx, theme) {
    const tables = [...theme.tables];
    const first = tables[0];
    const besideFirst = first && first.rows.length <= MAX_ROWS && first.columns.length <= 5;
    const groups = chunk(theme.analysis, besideFirst ? 800 : 1400);
    const heading = `${theme.tab || theme.kicker}: analyysi`;
    groups.forEach((group, i) => {
      const slide = contentSlide(pptx, i === 0 ? heading : `${heading} (jatkuu)`);
      const beside = i === 0 && besideFirst;
      slide.addText(paragraphRuns(group), { x: 0.6, y: 1.95, w: beside ? 6 : 11.6, h: 4.9, ...BODY });
      if (beside) {
        addTable(slide, first, first.rows, { x: 6.9, y: 1.95, w: 5.6 });
        tables.shift();
      }
      footer(slide, theme.meta);
    });
    for (const table of tables) {
      const title = shortTitle(table.caption) || theme.title;
      const shown = Math.min(table.rows.length, MAX_ROWS * MAX_TABLE_SLIDES);
      for (let start = 0; start < shown; start += MAX_ROWS) {
        const slide = contentSlide(pptx, start ? `${title} (jatkuu)` : title);
        addTable(slide, table, table.rows.slice(start, Math.min(start + MAX_ROWS, shown)), { x: 0.6, y: 1.95, w: 11.6 });
        const rest = start + MAX_ROWS >= shown && shown < table.rows.length ? `Taulukosta näytetään ${shown} riviä ${table.rows.length}:stä, koko taulukko verkkosivulla.` : "";
        footer(slide, [rest, theme.meta].filter(Boolean).join(" "));
      }
    }
  }
  function lastSlide(pptx, label) {
    const slide = pptx.addSlide();
    slide.background = bg(pick(LAST_BGS));
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.4, h: 7.5, fill: { color: INK2, transparency: 45 }, line: { color: INK2, transparency: 100 } });
    slide.addText("Kiitos!", { x: 0.6, y: 2.2, w: 5.6, h: 1.2, fontFace: FONT2, fontSize: 48, color: "FFFFFF" });
    slide.addText(`${BRAND}
${label}`, { x: 0.6, y: 3.5, w: 5.6, h: 1.2, fontFace: FONT2, fontSize: 18, color: "FFFFFF", valign: "top" });
  }
  var slug = (s) => s.toLowerCase().replace(/[äå]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  async function downloadDeck({ articles, whole = false }) {
    const PptxGenJS = await loadLibrary();
    const [pageName, place = ""] = document.title.split(" – ");
    const label = [place, pageName].filter(Boolean).join(" · ");
    const themes = [];
    for (const article of articles) themes.push(await collectTheme(article));
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = BRAND;
    pptx.title = whole ? label : `${label}: ${themes[0].tab}`;
    pptx.theme = { headFontFace: FONT2, bodyFontFace: FONT2 };
    titleSlide(pptx, { label: whole ? label : `${label} · ${themes[0].tab}`, theme: themes[0] });
    for (const theme of themes) {
      if (whole) subtitleSlide(pptx, theme);
      theme.charts.forEach((chart, i) => chartSlide(pptx, theme, chart, i));
      if (!theme.charts.length && theme.summary) {
        const slide = contentSlide(pptx, theme.title);
        slide.addText([{ text: "Yhteenveto", options: { bold: true, breakLine: true } }, { text: theme.summary }], { x: 0.6, y: 1.95, w: 11.6, h: 4.85, ...BODY });
        footer(slide, theme.meta);
      }
      analysisSlides(pptx, theme);
    }
    lastSlide(pptx, label);
    const name = [pageName, place, whole ? "" : themes[0].tab].filter(Boolean).map(slug).join("-");
    await pptx.writeFile({ fileName: `${name}.pptx` });
  }

  // frontend/components/pptx-button.js
  var ICON3 = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6v2h3v2H8v-2h3v-2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v10h14V5H5zm2 8 3-4 2 2 3-4 2 6H7z" fill="currentColor"/></svg>';
  var PptxButton = class extends HTMLElement {
    connectedCallback() {
      if (this.toggle) return;
      this.classList.add("share", "pptx");
      this.innerHTML = `
      <button type="button" class="share__toggle" aria-expanded="false">${ICON3}<span>PowerPoint</span></button>
      <div class="share__panel" hidden>
        <p class="share__label">Lataa PowerPoint-esitys</p>
        <div class="pptx__choices">
          <button type="button" class="share__copy" data-scope="article">Tämä artikkeli</button>
          <button type="button" class="share__copy" data-scope="page">Koko sivu</button>
        </div>
        <p class="share__status" role="status" aria-live="polite"></p>
      </div>`;
      this.toggle = this.querySelector(".share__toggle");
      this.panel = this.querySelector(".share__panel");
      this.status = this.querySelector(".share__status");
      this.toggle.addEventListener("click", () => this.setOpen(this.panel.hidden));
      this.panel.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-scope]");
        if (btn) this.download(btn.dataset.scope === "page");
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.setOpen(false);
      });
    }
    setOpen(open) {
      this.panel.hidden = !open;
      this.toggle.setAttribute("aria-expanded", String(open));
    }
    async download(whole) {
      const article = document.getElementById(this.getAttribute("target"));
      const articles = whole ? [...document.querySelectorAll("article[data-tab]")] : [article];
      this.status.textContent = "Muodostetaan esitystä…";
      this.panel.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
      });
      try {
        await downloadDeck({ articles, whole });
        this.status.textContent = "Esitys ladattu.";
      } catch (err) {
        console.error(err);
        this.status.textContent = `Esityksen muodostus epäonnistui: ${err.message}`;
      } finally {
        this.panel.querySelectorAll("button").forEach((b) => {
          b.disabled = false;
        });
      }
    }
  };
  customElements.define("pptx-button", PptxButton);

  // frontend/functions/compare.js
  var STORAGE_KEY2 = "tasapaino.verrokit";
  var PEERS_EVENT = "peers-change";
  var DEFAULT_PEERS = { kangasala: ["nokia", "ylojarvi"] };
  var COLORS = {
    main: "#DE232F",
    peer: ["#28336C", "#00ADC5"],
    classAvg: "#FCB316",
    best: "#009651",
    country: "#595959"
  };
  function readStorage2() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY2) || "null");
    } catch {
      return null;
    }
  }
  function storedPeers(main) {
    const fromUrl = new URLSearchParams(location.search).get("verrokit");
    if (fromUrl) return fromUrl.split(",").filter(Boolean).slice(0, 2);
    return readStorage2()?.[main] || null;
  }
  function setPeers(peers) {
    const main = getSelectedSlug();
    try {
      localStorage.setItem(STORAGE_KEY2, JSON.stringify({ ...readStorage2() || {}, [main]: peers }));
    } catch {
    }
    const url = new URL(location.href);
    url.searchParams.set("verrokit", peers.join(","));
    history.replaceState(null, "", url);
    window.dispatchEvent(new CustomEvent(PEERS_EVENT, { detail: { peers } }));
  }
  var onPeersChange = (callback) => window.addEventListener(PEERS_EVENT, (e) => callback(e.detail.peers));
  function defaultPeers(data, main) {
    if (DEFAULT_PEERS[main.slug]) return DEFAULT_PEERS[main.slug];
    return data.municipalities.filter((m) => m.slug !== main.slug && m.sizeClass === main.sizeClass).sort((a, b) => Math.abs(a.population - main.population) - Math.abs(b.population - main.population)).slice(0, 2).map((m) => m.slug);
  }
  var average = (name, values, kind, color) => ({ slug: null, name, kind, color, values });
  async function comparisonGroup(slug2 = getSelectedSlug()) {
    const data = await loadComparison();
    const bySlug = new Map(data.municipalities.map((m) => [m.slug, m]));
    const main = bySlug.get(slug2) || bySlug.get("kangasala");
    const peerSlugs = (storedPeers(main.slug) || defaultPeers(data, main)).filter((s) => s !== main.slug && bySlug.has(s));
    const peers = peerSlugs.map((s, i) => ({ ...bySlug.get(s), kind: "peer", color: COLORS.peer[i] }));
    const excluded = /* @__PURE__ */ new Set([main.slug, ...peerSlugs]);
    const best = (data.ranking[main.sizeClass] || []).filter((r) => !excluded.has(r.slug)).slice(0, 3).map((r) => ({ ...bySlug.get(r.slug), kind: "best", color: COLORS.best, score: r.score }));
    const classAvg = average(`Kokoluokan ka. (${main.sizeClass})`, data.averages.classes[main.sizeClass], "classAvg", COLORS.classAvg);
    const country = average("Manner-Suomen kuntien ka.", data.averages.country, "country", COLORS.country);
    const bestAvg = average("Kokoluokan 3 parasta (ka.)", Object.fromEntries(data.years.map((y) => [
      y,
      Object.fromEntries(Object.keys(data.indicators).map((id) => {
        const xs = best.map((b) => b.values[y]?.[id]).filter((x) => x != null);
        return [id, xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null];
      }))
    ])), "bestAvg", COLORS.best);
    const rank = (data.ranking[main.sizeClass] || []).findIndex((r) => r.slug === main.slug) + 1;
    return {
      data,
      year: data.latestYear,
      years: data.years,
      main: { ...main, kind: "main", color: COLORS.main },
      peers,
      best,
      classAvg,
      bestAvg,
      country,
      rank,
      classCount: (data.ranking[main.sizeClass] || []).length,
      members: [{ ...main, kind: "main", color: COLORS.main }, ...peers, classAvg, bestAvg, country],
      // Every unit separately, e.g. for the latest-year bars and tables.
      all: [{ ...main, kind: "main", color: COLORS.main }, ...peers, classAvg, ...best, country]
    };
  }
  var valueOf = (member, id, year) => member.values?.[year]?.[id] ?? null;
  function latestYearOf(group, id) {
    return [...group.years].reverse().find((y) => valueOf(group.main, id, y) != null) ?? group.year;
  }
  function classRank(group, id, year) {
    const ind = group.data.indicators[id];
    const rows = group.data.municipalities.filter((m) => m.sizeClass === group.main.sizeClass).map((m) => valueOf(m, id, year)).filter((v) => v != null);
    const own = valueOf(group.main, id, year);
    if (own == null || !ind.better) return { rank: null, count: rows.length };
    const better = rows.filter((v) => ind.better === "high" ? v > own : v < own).length;
    return { rank: better + 1, count: rows.length };
  }

  // frontend/components/peer-picker.js
  var PeerPicker = class extends HTMLElement {
    connectedCallback() {
      if (this.ready) return;
      this.ready = true;
      this.classList.add("peer-picker");
      this.innerHTML = '<p class="loading">Ladataan vertailujoukkoa…</p>';
      this.render();
      onMunicipalityChange(() => this.render());
      onPeersChange(() => this.render());
    }
    async render() {
      const [data, group] = await Promise.all([loadComparison(), comparisonGroup()]);
      const options = (selected) => data.municipalities.filter((m) => m.slug !== group.main.slug).map((m) => `<option value="${m.slug}"${m.slug === selected ? " selected" : ""}>${escapeHtml(m.name)}</option>`).join("");
      const chip = (m, label = m.name) => `<li><span class="peer-picker__dot" style="background:${m.color}"></span>${escapeHtml(label)}</li>`;
      this.innerHTML = `
      <div class="peer-picker__row">
        <span class="peer-picker__label">Verrokit</span>
        ${[0, 1].map((i) => `
          <label class="peer-picker__select">
            <span class="visually-hidden">Verrokkikunta ${i + 1}</span>
            <select data-index="${i}">${options(group.peers[i]?.slug)}</select>
          </label>`).join("")}
      </div>
      <ul class="peer-picker__legend" aria-label="Vertailujoukko">
        ${chip(group.main)}
        ${group.peers.map((p) => chip(p)).join("")}
        ${chip(group.classAvg, `Kokoluokan ka. (${group.data.municipalities.filter((m) => m.sizeClass === group.main.sizeClass).length} kuntaa)`)}
        ${chip(group.bestAvg, `Kokoluokan 3 parasta: ${group.best.map((b) => b.name).join(", ")}`)}
        ${chip(group.country)}
      </ul>`;
      this.querySelectorAll("select").forEach((select) => {
        select.addEventListener("change", () => {
          const peers = [...this.querySelectorAll("select")].map((s) => s.value);
          if (peers[0] === peers[1]) return;
          setPeers(peers);
        });
      });
    }
  };
  customElements.define("peer-picker", PeerPicker);

  // frontend/functions/pages-config.js
  var PAGES2 = [
    {
      id: "kokonaistalous",
      file: "kokonaistalous.html",
      script: "page-kokonaistalous.js",
      nav: "Kokonaistalous",
      title: "Kokonaistalous",
      standfirst: "Talouden tasapaino kuntatalouden avainluvuilla: tulorahoituksen riittävyys, rahavirrat, velka ja kuntakonserni.",
      keywords: "tasapaino kokonaistalous avainluvut vuosikate poistot rahavirta lainakanta konserni tytäryhteisöt liikelaitokset TOLT talousarvio",
      articles: [
        {
          id: "tila",
          tab: "Tasapainon tila",
          group: "Tilannekuva",
          title: "Tasapainon tila",
          standfirst: "Kuusi avainlukua kertoo, riittääkö tulorahoitus palveluihin, investointeihin ja velanhoitoon.",
          keywords: "avainluvut tilannekuva kriisikunta arviointimenettely"
        },
        {
          id: "rahavirta",
          tab: "Rahavirta",
          group: "Tilannekuva",
          title: "Toiminnan ja investointien rahavirta",
          standfirst: "FCG:n ja Kuntaliiton suosittelema tasapainon mittari: vuosikate miinus nettoinvestoinnit.",
          keywords: "rahavirta investoinnit luovutustulot rahoitusosuudet satunnaiset erät kassavarat lainanotto"
        },
        {
          id: "vuosikate",
          tab: "Vuosikate",
          group: "Tunnusluvut",
          indicator: "annualMargin",
          title: "Vuosikate",
          standfirst: "Tulorahoitus, joka jää juoksevien menojen jälkeen investointeihin ja lainojen lyhennyksiin.",
          intro: ["Vuosikate on keskeinen tulorahoituksen riittävyyden mittari. Perusoletus on, että tulorahoitus on riittävä, jos vuosikate on vähintään poistojen suuruinen."]
        },
        {
          id: "vuosikate-poistot",
          tab: "Vuosikate/poistot",
          group: "Tunnusluvut",
          indicator: "marginToDepreciation",
          title: "Vuosikate prosenttia poistoista",
          standfirst: "Yli 100 % tarkoittaa, että tulorahoitus riittää korvausinvestointeihin.",
          intro: ["Poistot kuvaavat keskimääräistä vuotuista korvausinvestointitarvetta. Jos vuosikate kattaa poistot, kunnan ei tarvitse velkaantua pitääkseen palvelujen tuotantovälineet kunnossa."]
        },
        {
          id: "tulos",
          tab: "Tilikauden tulos",
          group: "Tunnusluvut",
          indicator: "surplus",
          title: "Tilikauden ylijäämä (alijäämä)",
          standfirst: "Tilikauden yli- tai alijäämä euroa asukasta kohden."
        },
        {
          id: "kertynyt",
          tab: "Kertynyt ylijäämä",
          group: "Tunnusluvut",
          indicator: "accumulatedSurplus",
          title: "Kertynyt ylijäämä (alijäämä)",
          standfirst: "Taseeseen kertynyt yli- tai alijäämä. Kattamaton alijäämä on katettava neljässä vuodessa.",
          intro: ["Kuntalain mukaan taseeseen kertynyt alijäämä on katettava viimeistään neljän vuoden kuluessa sen syntymistä seuraavan vuoden alusta. Muuten valtuuston on hyväksyttävä tasapainotusohjelma."]
        },
        {
          id: "lainakanta",
          tab: "Lainakanta",
          group: "Tunnusluvut",
          indicator: "loans",
          title: "Lainakanta",
          standfirst: "Korollinen vieras pääoma 31.12. euroa asukasta kohden.",
          keywords: "velka lainat korollinen vieras pääoma korkokulut"
        },
        {
          id: "toimintakate",
          tab: "Toimintakate",
          group: "Tunnusluvut",
          indicator: "operatingMargin",
          title: "Toimintakate",
          standfirst: "Nettomenot, jotka rahoitetaan verotuloilla ja valtionosuuksilla."
        },
        {
          id: "konserni",
          tab: "Kuntakonserni",
          group: "Konserni ja TOLT",
          title: "Kuntakonserni",
          standfirst: "Kunnan ja sen tytäryhteisöjen, kuntayhtymäosuuksien ja liikelaitosten yhdistelty talous (KKOTR).",
          keywords: "konserni konsernitilinpäätös KKOTR tytäryhteisöt kuntayhtymät"
        },
        {
          id: "tolt",
          tab: "TOLT-yhteisöt",
          group: "Konserni ja TOLT",
          title: "Tytäryhteisöt, osakkuusyhteisöt ja liikelaitokset",
          standfirst: "TOLT: yhteisöt, joiden kautta kunta tuottaa palveluja tai sitoo pääomaa.",
          keywords: "TOLT TOLTA TOLTB tytäryhteisöt osakkuusyhteisöt liikelaitokset vesihuolto taseyksiköt"
        },
        {
          id: "talousarvio",
          tab: "Talousarvio ja ennuste",
          group: "Suunnitelma",
          title: "Talousarvio, taloussuunnitelma ja tilinpäätösennuste",
          standfirst: "Valtuuston hyväksymä talousarvio (KTAS) ja kunnan oma tilinpäätösennuste (KTPE) verrattuna toteumaan.",
          keywords: "KTAS KTPE talousarvio taloussuunnitelma tilinpäätösennuste investointisuunnitelma"
        },
        {
          id: "kehitys",
          tab: "Kehitysehdotukset",
          group: "Suunnitelma",
          title: "Kehitysehdotukset",
          standfirst: "Tunnuslukujen perusteella johdetut kehitysehdotukset tasapainon parantamiseksi."
        }
      ]
    },
    {
      id: "palveluluokat",
      file: "palveluluokat.html",
      script: "page-palveluluokat.js",
      nav: "Palveluluokat",
      title: "Ulkoiset tulot ja menot palveluluokittain",
      standfirst: "Ulkoiset tulot ja menot euroa asukasta kohden palveluluokittain ja tileittäin, lakisääteisyys sekä ostolaskut.",
      keywords: "palveluluokat ulkoiset menot tulot tileittäin lakisääteiset tehtävät opetus ostolaskut toimittajat KKTPP TOTT",
      articles: [
        {
          id: "menot",
          tab: "Menot palveluluokittain",
          group: "Palveluluokat",
          title: "Ulkoiset toimintakulut palveluluokittain",
          standfirst: "Euroa asukasta kohden; pienet pisteet ovat kokoluokan muut kunnat.",
          keywords: "toimintakulut menot palveluluokka"
        },
        {
          id: "tulot",
          tab: "Tulot palveluluokittain",
          group: "Palveluluokat",
          title: "Ulkoiset toimintatuotot palveluluokittain",
          standfirst: "Myynti-, maksu- ja vuokratuotot sekä tuet palveluittain euroa asukasta kohden.",
          keywords: "toimintatuotot maksutuotot myyntituotot tulot palveluluokka"
        },
        {
          id: "lakisaateiset",
          tab: "Lakisääteisyys",
          group: "Palveluluokat",
          title: "Erot keskiarvoon lakisääteisyyden mukaan",
          standfirst: "Missä palveluluokissa menot ylittävät kokoluokan keskiarvon, ja onko tehtävä lakisääteinen.",
          keywords: "lakisääteiset tehtävät vapaaehtoiset tehtävät säästökohteet VM"
        },
        {
          id: "kulurakenne",
          tab: "Kulut tileittäin",
          group: "Tileittäin",
          title: "Toimintakulut tileittäin",
          standfirst: "Henkilöstökulut, palvelujen ostot, aineet, avustukset ja muut kulut euroa asukasta kohden.",
          keywords: "henkilöstökulut palvelujen ostot asiakaspalvelujen ostot aineet avustukset tilit"
        },
        {
          id: "tulorakenne",
          tab: "Tulot tileittäin",
          group: "Tileittäin",
          title: "Toimintatuotot tileittäin",
          standfirst: "Myynti-, maksu-, tuki- ja vuokratuotot euroa asukasta kohden.",
          keywords: "myyntituotot maksutuotot vuokratuotot tuet avustukset tilit"
        },
        {
          id: "henkilosto",
          tab: "Henkilöstökulut",
          group: "Tileittäin",
          indicator: "personnel",
          title: "Henkilöstökulut",
          standfirst: "Henkilöstökulut euroa asukasta kohden."
        },
        {
          id: "opetus",
          tab: "Opetuksen kustannukset",
          group: "Opetus",
          title: "Esi-, perus- ja lukio-opetuksen kustannukset",
          standfirst: "Toimintakulut ikäluokan asukasta kohden (TOTT).",
          keywords: "TOTT esiopetus perusopetus lukio oppilas kustannus"
        },
        {
          id: "ostolaskut",
          tab: "Ostot yleiskuva",
          group: "Ostolaskut",
          title: "Ostolaskut 2023–2025",
          standfirst: "Kuntien julkaisemat ostolaskut tiliryhmittäin, ilman arvonlisäveroa.",
          keywords: "ostolaskut hankinnat ostot pienlaskut"
        },
        {
          id: "toimittajat",
          tab: "Suurimmat toimittajat",
          group: "Ostolaskut",
          title: "Suurimmat toimittajat",
          standfirst: "Suurimmat toimittajat ja niiden osuus ostoista vuosittain.",
          keywords: "toimittajat hankinnat kilpailutus"
        },
        {
          id: "yhteiset",
          tab: "Yhteiset toimittajat",
          group: "Ostolaskut",
          title: "Yhteiset toimittajat",
          standfirst: "Toimittajat, joilta molemmat kunnat ostavat: yhteishankintojen mahdollisuudet.",
          keywords: "yhteishankinta toimittajat kilpailutus"
        }
      ]
    },
    {
      id: "verotus",
      file: "verotus.html",
      script: "page-verotus.js",
      nav: "Verotus",
      title: "Verotus",
      standfirst: "Veroasteet, verotulot ja veropohja verrattuna verrokkeihin, sekä veroprosenttien muutosten vaikutukset.",
      keywords: "verotus veroprosentti efektiivinen veroaste kunnallisvero kiinteistövero yhteisövero valtionosuudet ansiotulot simulaattori",
      articles: [
        {
          id: "efektiivinen",
          tab: "Efektiivinen veroaste",
          group: "Veroasteet",
          indicator: "effectiveTaxRate",
          title: "Efektiivinen veroaste",
          standfirst: "Maksuunpantu kunnallisvero prosentteina ansiotuloista.",
          intro: [
            "Efektiivinen veroaste kertoo, kuinka paljon kunta tosiasiassa saa veroa suhteessa asukkaidensa ansiotuloihin. Se on aina nimellistä tuloveroprosenttia matalampi, koska vähennykset (mm. perusvähennys, ansiotulovähennys ja työtulovähennys) painottuvat pienille tuloille.",
            "Laskenta: maksuunpantu kunnallisvero / ansiotulot yhteensä × 100 (Verohallinto, henkilöasiakkaiden tuloverotilastot)."
          ]
        },
        {
          id: "suhde",
          tab: "Efektiivinen/nimellinen",
          group: "Veroasteet",
          indicator: "effectiveToNominal",
          title: "Efektiivisen ja nimellisen veroasteen suhde",
          standfirst: "Kuinka suuri osa nimellisestä veroprosentista toteutuu verotuloina.",
          intro: ["Mitä suurempi suhde on, sitä vähemmän vähennykset pienentävät verotuloa. Suhde on korkea kunnissa, joissa tulotaso on korkea."]
        },
        {
          id: "nimellinen",
          tab: "Tuloveroprosentti",
          group: "Veroasteet",
          indicator: "nominalTaxRate",
          title: "Tuloveroprosentti",
          standfirst: "Valtuuston päättämä tuloveroprosentti (Kuntaliitto, Verohallinto).",
          intro: ["Sote-uudistuksessa vuonna 2023 kaikkien kuntien tuloveroprosentteja alennettiin 12,64 prosenttiyksikköä."]
        },
        {
          id: "kunnallisvero",
          tab: "Kunnallisvero",
          group: "Verotulot",
          indicator: "municipalTax",
          title: "Kunnallisveron tuotto",
          standfirst: "Kunnan tulovero euroa asukasta kohden (tilinpäätös)."
        },
        {
          id: "kiinteistovero",
          tab: "Kiinteistövero",
          group: "Verotulot",
          indicator: "propertyTax",
          title: "Kiinteistöveron tuotto",
          standfirst: "Kiinteistövero euroa asukasta kohden (tilinpäätös)."
        },
        {
          id: "yhteisovero",
          tab: "Yhteisövero",
          group: "Verotulot",
          indicator: "corporateTax",
          title: "Yhteisöveron tuotto",
          standfirst: "Kunnan osuus yhteisöveron tuotosta euroa asukasta kohden."
        },
        {
          id: "valtionosuudet",
          tab: "Valtionosuudet",
          group: "Verotulot",
          indicator: "stateAid",
          title: "Valtionosuudet",
          standfirst: "Valtionosuudet euroa asukasta kohden.",
          intro: ["Valtionosuusjärjestelmä muuttui merkittävästi vuoden 2023 alusta. Verotuloihin perustuva valtionosuuksien tasaus pienentää verotulojen kasvun nettovaikutusta keskimääräistä vauraammissa kunnissa."]
        },
        {
          id: "ansiotulot",
          tab: "Ansiotulot",
          group: "Veropohja",
          indicator: "earnedIncome",
          title: "Veronalaiset ansiotulot",
          standfirst: "Ansiotulot yhteensä euroa asukasta kohden (Verohallinto)."
        },
        {
          id: "tuotot-kulut",
          tab: "Toimintatuotot/-kulut",
          group: "Veropohja",
          indicator: "incomeToCosts",
          title: "Toimintatuotot suhteessa toimintakuluihin",
          standfirst: "Kuinka suuri osa toimintakuluista katetaan myynti-, maksu-, tuki- ja vuokratuotoilla."
        },
        {
          id: "simulaattori",
          tab: "Simulaattori",
          group: "Simulaattori",
          title: "Veroprosenttisimulaattori",
          standfirst: "Kuinka paljon tulo- ja kiinteistöveroprosenttien muutos tuottaisi vuodessa?",
          keywords: "simulaattori veroprosentin korotus kiinteistöveroprosentti laskuri"
        }
      ]
    },
    {
      id: "toimenpiteet",
      file: "toimenpiteet.html",
      script: "page-toimenpiteet.js",
      nav: "Toimenpiteet",
      title: "Tasapainotusohjelman toimenpiteet",
      standfirst: "Viisi näkökulmaa ja kunkin viisi tärkeintä nostoa: palveluverkko, toimintakulut ja tuotanto, investoinnit ja kiinteistöt, tulojen vahvistaminen sekä jokeri.",
      keywords: "tasapainotusohjelma toimenpiteet säästöt sopeutus palveluverkko investoinnit kiinteistöt tulot jokeri tekoäly",
      articles: [
        {
          id: "palveluverkko",
          tab: "Palveluverkko",
          title: "Palveluverkko",
          standfirst: "Koulujen, päiväkotien ja muiden toimipisteiden verkko suhteessa palvelutarpeeseen.",
          keywords: "kouluverkko päiväkodit toimipisteet yhdistäminen"
        },
        {
          id: "toimintakulut",
          tab: "Toimintakulut ja tuotanto",
          title: "Toimintakulut ja tuotanto",
          standfirst: "Prosessien tehostaminen, henkilöstömenot ja palvelujen uudelleenjärjestely.",
          keywords: "tehostaminen henkilöstö ostopalvelut hankinnat"
        },
        {
          id: "investoinnit",
          tab: "Investoinnit ja kiinteistöt",
          title: "Investoinnit ja kiinteistöt",
          standfirst: "Investointitaso, rahoituskyky ja omaisuuden myynti.",
          keywords: "investoinnit kiinteistöt omaisuuden myynti metsät"
        },
        {
          id: "tulot",
          tab: "Tulojen vahvistaminen",
          title: "Tulojen vahvistaminen",
          standfirst: "Veroprosentit, maksut ja muut tulolähteet.",
          keywords: "veroprosentti maksut tulolähteet kiinteistövero"
        },
        {
          id: "jokeri",
          tab: "Jokeri: tekoäly",
          title: "Jokeri: tekoäly ja automaatio",
          standfirst: "Viides keino: tekoäly, automaatio ja data tuottavuuden lähteenä.",
          keywords: "jokeri tekoäly automaatio robotiikka data ostolaskut"
        }
      ]
    }
  ];
  var pageById = (id) => PAGES2.find((p) => p.id === id);

  // frontend/functions/article-common.js
  var nf02 = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat("fi-FI", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf22 = new Intl.NumberFormat("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtEurPc = (v) => v == null ? "–" : `${nf02.format(v)} €/as`;
  var fmtMe2 = (v) => v == null ? "–" : `${nf1.format(v / 1e6)} M€`;
  var fmtPct = (v, d = 1) => v == null ? "–" : `${(d === 2 ? nf22 : nf1).format(v)} %`;
  var fmtNum = (v) => v == null ? "–" : nf1.format(v);
  function formatter(unit) {
    if (unit === "%") return (v) => fmtPct(v, Math.abs(v ?? 0) < 20 ? 2 : 1);
    if (unit === "€/as") return fmtEurPc;
    return fmtNum;
  }
  var axisFormat = (unit) => unit === "%" ? (v) => nf1.format(v) : (v) => nf02.format(v);
  var paragraphs = (list) => list.filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  var byPrefix = (prefix) => (name) => document.getElementById(`${prefix}-${name}`);
  function figureHtml(id, { title, subtitle = "", source = "", body }) {
    return `
    <figure class="figure" id="${id}">
      <h2 class="figure__title">${escapeHtml(title)}</h2>
      ${subtitle ? `<p class="figure__subtitle">${escapeHtml(subtitle)}</p>` : ""}
      ${body}
      ${source ? `<p class="figure__source">Lähde: ${escapeHtml(source)}</p>` : ""}
    </figure>`;
  }
  function summaryHtml(text2, title = "Yhteenveto") {
    return `<aside class="summary-box"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text2)}</p></aside>`;
  }
  function showError(container, err) {
    console.error(err);
    container.innerHTML = `<p class="error">Tietojen haku epäonnistui: ${escapeHtml(err.message)}</p>`;
  }
  var diffPct = (a, b) => a == null || b == null || b === 0 ? null : 100 * (a - b) / Math.abs(b);
  function compareWords(own, ref, unit) {
    if (own == null || ref == null) return "ei vertailutietoa";
    if (unit === "%") {
      const d2 = own - ref;
      return `${nf1.format(Math.abs(d2))} %-yksikköä ${d2 >= 0 ? "korkeampi" : "matalampi"}`;
    }
    const d = diffPct(own, ref);
    return `${nf02.format(Math.abs(d))} % ${d >= 0 ? "suurempi" : "pienempi"}`;
  }
  function lazyArticles(submenu, renderers) {
    const done = /* @__PURE__ */ new Set();
    const run = (id) => {
      if (!renderers[id] || done.has(id)) return;
      done.add(id);
      Promise.resolve(renderers[id]()).catch((err) => showError(document.getElementById(`${id}-content`), err));
    };
    submenu.addEventListener("tab-change", (e) => run(e.detail.id));
    run(submenu.selected || submenu.querySelector("article[data-tab]")?.id);
    return {
      // Re-render the open article, forget the others.
      reset() {
        done.clear();
        run(submenu.selected);
      }
    };
  }

  // frontend/components/line-chart.js
  function pointLabel(ts, period) {
    const d = new Date(ts);
    if (period === "auto") period = d.getUTCMonth() === 11 && d.getUTCDate() === 31 ? "year" : "month";
    if (period === "month") return `${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
    if (period === "quarter") return `Q${Math.floor(d.getUTCMonth() / 3) + 1}/${d.getUTCFullYear()}`;
    return `${d.getUTCFullYear()}`;
  }
  var LineChart = class extends ChartBase {
    buildOption(data, { compact = false, exporting = false, zoom = {} } = {}) {
      const fmt = data.valueFormat || fmtInt;
      const showLegend = !compact || data.series.length > 1;
      const withSlider = !compact && !exporting;
      const zoomWindow = exporting ? zoom : { startValue: data.zoomStart };
      const hasSecondAxis = data.series.some((s) => s.axis === 1);
      return {
        backgroundColor: "transparent",
        textStyle: { fontFamily: FONT, color: INK },
        animationDuration: 600,
        grid: {
          left: 4,
          right: compact ? 8 : 16,
          // Narrow screens wrap a legend of two or more items onto two rows.
          top: !showLegend ? 12 : data.series.length > 1 && this.canvas?.clientWidth < 520 ? 76 : 52,
          bottom: withSlider ? 72 : compact ? 8 : 32,
          containLabel: true
        },
        legend: {
          show: showLegend,
          top: 0,
          left: 0,
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
          textStyle: legendText(compact)
        },
        tooltip: {
          show: !exporting,
          trigger: "axis",
          backgroundColor: "#fff",
          borderColor: GRID,
          textStyle: { fontFamily: FONT, color: INK, fontSize: 12 },
          formatter: (items) => {
            const s = data.series[items[0].seriesIndex];
            const seen = /* @__PURE__ */ new Set();
            const unique = items.filter((i) => {
              if (i.value[1] == null) return false;
              const key = `${i.seriesName}|${i.value[1]}`;
              return !seen.has(key) && seen.add(key);
            });
            if (!unique.length) return "";
            return `<b>${pointLabel(items[0].value[0], s.period)}</b><br>` + unique.map((i) => `${i.marker}${i.seriesName}: <b>${fmt(i.value[1])}</b>`).join("<br>");
          }
        },
        xAxis: {
          type: "time",
          // Yearly series: one tick per year, no month labels.
          minInterval: data.series.every((x) => x.period === "year") ? 365 * 24 * 3600 * 1e3 : void 0,
          name: compact ? "" : data.xName ?? "Vuosi",
          nameLocation: "middle",
          nameGap: 28,
          nameTextStyle: axisName(compact),
          axisLine: { lineStyle: { color: INK } },
          axisTick: { show: false },
          axisLabel: {
            ...axisLabel(compact),
            hideOverlap: true,
            // Level-based labels: years when zoomed out, months when zoomed in.
            formatter: { year: "{yyyy}", month: "{M}/{yyyy}", day: "{d}.{M}.{yyyy}" }
          },
          splitLine: { show: false }
        },
        yAxis: [
          {
            type: "value",
            name: compact ? "" : data.yName || "",
            nameTextStyle: axisName(compact, { align: "left" }),
            scale: true,
            splitNumber: compact ? 3 : 5,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
            splitLine: SPLIT_LINE
          },
          // Second axis for a series of a much smaller scale; no grid lines of its own.
          ...hasSecondAxis ? [{
            type: "value",
            position: "right",
            name: compact ? "" : data.y2Name || "",
            nameTextStyle: axisName(compact, { align: "right" }),
            scale: true,
            splitNumber: compact ? 3 : 5,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { ...axisLabel(compact), formatter: (v) => fmt(v) },
            splitLine: { show: false }
          }] : []
        ],
        dataZoom: compact ? [] : [
          // weakFilter lets the y-axis rescale to the zoomed window.
          { type: "inside", filterMode: "weakFilter", ...zoomWindow },
          ...withSlider ? [sliderZoom({ ...zoomWindow, filterMode: "weakFilter", labelFormatter: (v) => new Date(v).getUTCFullYear() })] : []
        ],
        series: data.series.map((s, i) => {
          const color = s.color || paletteColor(i);
          const lineType = s.dashed === true ? "dashed" : s.dashed || "solid";
          return {
            name: s.name,
            type: "line",
            data: s.data,
            yAxisIndex: hasSecondAxis && s.axis === 1 ? 1 : 0,
            smooth: 0.5,
            showSymbol: s.symbol !== false,
            showAllSymbol: true,
            symbol: "circle",
            symbolSize: compact ? 6 : 8,
            lineStyle: { color, width: 2.5, type: lineType },
            itemStyle: { color, borderColor: "#ffffff", borderWidth: 2, borderType: "solid" },
            emphasis: { focus: "series" }
          };
        })
      };
    }
  };
  customElements.define("line-chart", LineChart);

  // frontend/components/data-table.js
  function cellClass(column, value) {
    const classes = [];
    if (column.numeric) classes.push("num");
    if (column.signColor && typeof value === "number") {
      if (value > 0) classes.push("pos");
      if (value < 0) classes.push("neg");
    }
    return classes.join(" ");
  }
  var DataTable = class extends HTMLElement {
    setData(data) {
      this.data = data;
      this.sort = data.sort || null;
      this.render();
    }
    sortedRows() {
      const rows = [...this.data.rows];
      if (!this.sort) return rows;
      const { key, dir } = this.sort;
      const sign = dir === "asc" ? 1 : -1;
      return rows.sort((a, b) => {
        const va = a[key];
        const vb = b[key];
        if (va == null) return 1;
        if (vb == null) return -1;
        return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb), "fi")) * sign;
      });
    }
    render() {
      const { columns, highlight, caption } = this.data;
      const ariaSort = (c) => this.sort?.key === c.key ? this.sort.dir === "asc" ? "ascending" : "descending" : "none";
      const arrow = (c) => this.sort?.key === c.key ? this.sort.dir === "asc" ? "▲" : "▼" : "↕";
      this.innerHTML = `
      <div class="data-table">
        <table>
          ${caption ? `<caption>${escapeHtml(caption)}</caption>` : ""}
          <thead><tr>
            ${columns.map((c) => `
              <th scope="col" aria-sort="${ariaSort(c)}" class="${c.numeric ? "num" : ""}">
                <button type="button" data-key="${c.key}">${escapeHtml(c.label)} <span aria-hidden="true">${arrow(c)}</span></button>
              </th>`).join("")}
          </tr></thead>
          <tbody>
            ${this.sortedRows().map((row) => `
              <tr${highlight?.(row) ? ' class="is-highlight"' : ""}>
                ${columns.map((c) => `<td class="${cellClass(c, row[c.key])}">${escapeHtml(c.format ? c.format(row[c.key], row) : row[c.key] ?? "")}</td>`).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
      this.querySelectorAll("th button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const dir = this.sort?.key === key && this.sort.dir === "desc" ? "asc" : "desc";
          this.sort = { key, dir };
          this.render();
        });
      });
    }
  };
  customElements.define("data-table", DataTable);

  // frontend/functions/indicator-article.js
  var yearTs = (y) => Date.UTC(Number(y), 0, 1);
  function trendSentence(name, values, unit, fmt) {
    const xs = values.filter(([, v]) => v != null);
    if (xs.length < 2) return "";
    const [y0, v0] = xs[0];
    const [y1, v1] = xs.at(-1);
    if (unit === "%") {
      const d2 = v1 - v0;
      return `${name}: ${fmt(v0)} vuonna ${y0} ja ${fmt(v1)} vuonna ${y1} (${d2 >= 0 ? "+" : "−"}${Math.abs(d2).toFixed(1).replace(".", ",")} %-yksikköä).`;
    }
    const d = diffPct(v1, v0);
    return `${name}: ${fmt(v0)} vuonna ${y0} ja ${fmt(v1)} vuonna ${y1}${d == null ? "" : ` (${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d))} %)`}.`;
  }
  function headline(group, id, year) {
    const ind = group.data.indicators[id];
    const own = valueOf(group.main, id, year);
    const ref = valueOf(group.classAvg, id, year);
    if (own == null) return `${ind.label}: ei tietoa vuodelta ${year}`;
    const words2 = compareWords(own, ref, ind.unit);
    return `${group.main.name}: ${ind.label.toLowerCase()} ${formatter(ind.unit)(own)} – ${words2} kuin kokoluokassa keskimäärin (${year})`;
  }
  async function renderIndicator(prefix, group, { id, intro = [], source = "Valtiokonttori, kuntien taloustietopalvelu; Tilastokeskus", note = "" }) {
    const el = byPrefix(prefix);
    const ind = group.data.indicators[id];
    const fmt = formatter(ind.unit);
    const year = latestYearOf(group, id);
    const years = group.years.filter((y) => group.members.some((m) => valueOf(m, id, y) != null));
    const own = valueOf(group.main, id, year);
    const avg = valueOf(group.classAvg, id, year);
    const best = valueOf(group.bestAvg, id, year);
    const { rank, count } = classRank(group, id, year);
    el("title").textContent = headline(group, id, year);
    el("kicker").textContent = `${group.main.name} · ${ind.label}`;
    const analysis = [
      `${group.main.name}: ${fmt(own)} vuonna ${year}. Kokoluokan keskiarvo on ${fmt(avg)} ja kokoluokan kolmen parhaan keskiarvo ${fmt(best)}.`,
      ...group.peers.map((p) => `${p.name}: ${fmt(valueOf(p, id, year))}.`),
      rank ? `${group.main.name} on kokoluokassaan sijalla ${rank}/${count} (${ind.better === "high" ? "suurin" : "pienin"} ensin).` : "",
      trendSentence(group.main.name, years.map((y) => [y, valueOf(group.main, id, y)]), ind.unit, fmt)
    ];
    const position = ind.better && own != null && avg != null ? ind.better === "high" === own >= avg ? "paremmalla" : "heikommalla" : null;
    el("content").innerHTML = `
    <div class="article__body">${paragraphs(intro)}</div>
    ${figureHtml(`${prefix}-trend`, {
      title: `${ind.label} vuosina ${years[0]}–${years.at(-1)}`,
      subtitle: `${ind.unit}. Kokoluokka: ${group.main.sizeClass}.`,
      source,
      body: `<line-chart id="${prefix}-chart"></line-chart>`
    })}
    ${figureHtml(`${prefix}-latest`, {
      title: `${ind.label} vuonna ${year} vertailujoukossa`,
      subtitle: `${ind.unit}. Kokoluokan parhaat: talouden vahvuuden pisteytys (toiminnan ja investointien rahavirta, vuosikate/poistot, lainakanta, kertynyt ylijäämä, konsernin lainakanta).`,
      source,
      body: `<bar-chart id="${prefix}-bars" class="chart--bars"></bar-chart>`
    })}
    <div class="article__body" id="${prefix}-analysis">
      <h2>Analyysi</h2>
      ${paragraphs(analysis)}
      ${note ? `<p class="note">${note}</p>` : ""}
    </div>
    ${position ? summaryHtml(`${group.main.name} on tässä tunnusluvussa ${position} tasolla kuin kokoluokka keskimäärin (${compareWords(own, avg, ind.unit)}).`) : ""}
    <data-table id="${prefix}-table"></data-table>`;
    el("chart").setData({
      series: group.members.map((m) => ({
        name: m.name,
        color: m.color,
        dashed: m.kind === "classAvg" ? true : m.kind === "country" ? "dotted" : false,
        period: "year",
        data: years.map((y) => [yearTs(y), valueOf(m, id, y)])
      })),
      yName: ind.unit,
      valueFormat: axisFormat(ind.unit),
      filename: `${prefix}-${group.main.slug}`,
      csv: {
        header: ["Yksikkö", ...years],
        rows: group.members.map((m) => [m.name, ...years.map((y) => valueOf(m, id, y))])
      }
    });
    const units = group.all.filter((m) => valueOf(m, id, year) != null);
    el("bars").style.setProperty("--rows", units.length);
    el("bars").setData({
      categories: units.map((m) => m.kind === "best" ? `${m.name} (paras)` : m.name),
      series: [{ name: ind.label, values: units.map((m) => ({ value: valueOf(m, id, year), itemStyle: { color: m.color } })) }],
      horizontal: true,
      valueFormat: axisFormat(ind.unit),
      filename: `${prefix}-${year}-${group.main.slug}`,
      csv: { header: ["Yksikkö", `${ind.label} ${year} (${ind.unit})`], rows: units.map((m) => [m.name, valueOf(m, id, year)]) }
    });
    el("table").setData({
      caption: `${ind.label} (${ind.unit})`,
      columns: [
        { key: "name", label: "Yksikkö" },
        ...years.map((y) => ({ key: y, label: y, numeric: true, format: (v) => fmt(v) }))
      ],
      rows: group.all.map((m) => ({ name: m.name, kind: m.kind, ...Object.fromEntries(years.map((y) => [y, valueOf(m, id, y)])) })),
      highlight: (r) => r.kind === "main"
    });
  }

  // frontend/functions/subpage.js
  function setNames(name) {
    document.querySelectorAll("[data-kunta-name]").forEach((el) => {
      el.textContent = name;
    });
  }
  async function setupPage(pageId, custom = {}) {
    const page = pageById(pageId);
    const submenu = document.querySelector("site-submenu");
    let group = await comparisonGroup();
    setNames(group.main.name);
    const renderers = {};
    for (const a of page.articles) {
      if (custom[a.id]) renderers[a.id] = () => custom[a.id](a, group);
      else if (a.indicator) renderers[a.id] = () => renderIndicator(a.id, group, { id: a.indicator, intro: a.intro || [] });
    }
    const lazy = lazyArticles(submenu, renderers);
    const refresh = async () => {
      group = await comparisonGroup();
      setNames(group.main.name);
      lazy.reset();
    };
    onMunicipalityChange(() => {
      const url = new URL(location.href);
      url.searchParams.delete("verrokit");
      history.replaceState(null, "", url);
      refresh();
    });
    onPeersChange(refresh);
    return { page, get group() {
      return group;
    } };
  }

  // frontend/functions/page-verotus.js
  var latestKey = (obj, below = Infinity) => Object.keys(obj || {}).filter((k) => Number(k) < below).sort().at(-1);
  async function renderSimulator(a, group) {
    const el = byPrefix(a.id);
    const [income, property, rates] = await Promise.all([loadIncomeTax(), loadPropertyTax(), loadTaxRates()]);
    const code = group.main.code;
    const incomeYear = latestKey(income.municipalities[code]);
    const inc = income.municipalities[code][incomeYear];
    const rateYear = latestKey(rates.municipalities[code]);
    const r = rates.municipalities[code][rateYear];
    const propYear = latestKey(property.municipalities[code], property.preliminary);
    const p = property.municipalities[code][propYear];
    const pop = valueOf(group.main, "population", group.year);
    const implied = (use) => p[use]?.value ? Math.round(1e4 * p[use].tax / p[use].value) / 100 : null;
    const uses = {
      residential: { value: p.residential?.value, rate: r.propertyResidential ?? implied("residential") },
      general: { value: p.general?.value, rate: r.propertyGeneral ?? implied("general") },
      land: { value: p.land?.value, rate: implied("land") },
      otherResidential: { value: p.otherResidential?.value, rate: implied("otherResidential") }
    };
    const step = inc.taxableEarned * 25e-4;
    el("title").textContent = `${group.main.name}: 0,25 %-yksikön tuloveron korotus tuottaisi noin ${fmtMe2(step)} vuodessa, 0,1 %-yksikön vakituisen asunnon kiinteistöveron korotus ${fmtMe2(uses.residential.value * 1e-3)}`;
    el("content").innerHTML = `
    <div class="article__body">${paragraphs([
      `Simulaattori laskee veroprosenttien muutoksen staattisen vaikutuksen viimeisimmän veropohjan perusteella: tulovero verovuodelta ${incomeYear} (Verohallinto, verotettava ansiotulo kunnallisverotuksessa) ja kiinteistövero vuodelta ${propYear} (Verohallinto, verotusarvot käyttötarkoituksittain). Veroprosentit: Kuntaliitto ${rateYear}.`
    ])}</div>
    <tax-simulator id="${a.id}-sim"></tax-simulator>
    ${figureHtml(`${a.id}-fig`, { title: "Muutoksen vaikutus veroittain", subtitle: "M€ vuodessa", source: "Verohallinto; Kuntaliitto", body: `<bar-chart id="${a.id}-chart"></bar-chart>` })}
    <div class="article__body" id="${a.id}-analysis"><h2>Huomioitavaa</h2>${paragraphs([
      "Tuloveron muutos näkyy verotilityksissä viiveellä ja vaikuttaa valtionosuuksien verotuloihin perustuvaan tasaukseen. Kiinteistövero ei vaikuta tasaukseen.",
      `Tuloveroprosentti on nyt ${fmtPct(r.income, 2)}. Kokoluokan keskiarvo on ${fmtPct(valueOf(group.classAvg, "nominalTaxRate", group.year), 2)}.`
    ])}</div>`;
    const sim = el("sim");
    const labels = { income: "Tulovero", residential: "Vakituiset asunnot", general: "Yleinen (rakennukset)", land: "Maapohja", otherResidential: "Muut asuinrakennukset" };
    sim.addEventListener("simulate", (e) => {
      const keys = Object.keys(e.detail.effects);
      el("chart").setData({
        categories: keys.map((k) => labels[k]),
        series: [{ name: "Muutos", color: COLORS.main, values: keys.map((k) => e.detail.effects[k].euros) }],
        horizontal: true,
        signColors: true,
        valueFormat: (v) => fmtMe2(v).replace(" M€", ""),
        filename: `simulaattori-${group.main.slug}`,
        csv: { header: ["Vero", "Uusi prosentti", "Muutos (€)"], rows: keys.map((k) => [labels[k], e.detail.effects[k].rate, e.detail.effects[k].euros]) }
      });
    });
    sim.setData({
      name: group.main.name,
      population: pop,
      income: { year: incomeYear, taxableEarned: inc.taxableEarned, recipients: inc.recipients, rate: r.income },
      property: { year: propYear, uses }
    });
  }
  setupPage("verotus", { simulaattori: renderSimulator });
})();
