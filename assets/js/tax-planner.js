(function () {
  const TAX_YEAR = 2025;

  const DATA = {
    federalStandardDeduction: {
      single: 15750,
      mfj: 31500,
      mfs: 15750,
      hoh: 23625
    },
    federalBrackets: {
      single: [
        [0, 11925, 0.10],
        [11925, 48475, 0.12],
        [48475, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250525, 0.32],
        [250525, 626350, 0.35],
        [626350, Infinity, 0.37]
      ],
      mfj: [
        [0, 23850, 0.10],
        [23850, 96950, 0.12],
        [96950, 206700, 0.22],
        [206700, 394600, 0.24],
        [394600, 501050, 0.32],
        [501050, 751600, 0.35],
        [751600, Infinity, 0.37]
      ],
      mfs: [
        [0, 11925, 0.10],
        [11925, 48475, 0.12],
        [48475, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250525, 0.32],
        [250525, 375800, 0.35],
        [375800, Infinity, 0.37]
      ],
      hoh: [
        [0, 17000, 0.10],
        [17000, 64850, 0.12],
        [64850, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250500, 0.32],
        [250500, 626350, 0.35],
        [626350, Infinity, 0.37]
      ]
    },
    caStandardDeduction: {
      single: 5706,
      mfj: 11412,
      mfs: 5706,
      hoh: 11412
    },
    caBrackets: {
      single: [
        [0, 11079, 0.01],
        [11079, 26264, 0.02],
        [26264, 41452, 0.04],
        [41452, 57542, 0.06],
        [57542, 72724, 0.08],
        [72724, 371479, 0.093],
        [371479, 445771, 0.103],
        [445771, 742953, 0.113],
        [742953, Infinity, 0.123]
      ],
      mfj: [
        [0, 22158, 0.01],
        [22158, 52528, 0.02],
        [52528, 82904, 0.04],
        [82904, 115084, 0.06],
        [115084, 145448, 0.08],
        [145448, 742958, 0.093],
        [742958, 891542, 0.103],
        [891542, 1485906, 0.113],
        [1485906, Infinity, 0.123]
      ],
      mfs: [
        [0, 11079, 0.01],
        [11079, 26264, 0.02],
        [26264, 41452, 0.04],
        [41452, 57542, 0.06],
        [57542, 72724, 0.08],
        [72724, 371479, 0.093],
        [371479, 445771, 0.103],
        [445771, 742953, 0.113],
        [742953, Infinity, 0.123]
      ],
      hoh: [
        [0, 22173, 0.01],
        [22173, 52530, 0.02],
        [52530, 67716, 0.04],
        [67716, 83805, 0.06],
        [83805, 98990, 0.08],
        [98990, 505208, 0.093],
        [505208, 606251, 0.103],
        [606251, 1010417, 0.113],
        [1010417, Infinity, 0.123]
      ]
    }
  };

  const ids = [
    "youWages",
    "spouseWages",
    "otherFederalIncome",
    "federalAdjustments",
    "caWages",
    "spouseCaWages",
    "caOtherIncome",
    "caSourceAdjustments",
    "caAgiOverride",
    "federalItemized",
    "federalExtraDeductions",
    "federalCredits",
    "caItemized",
    "caSubtractions",
    "caAdditions",
    "caCredits",
    "caPersonalCount",
    "caDependentCount",
    "caSeniorBlindCount",
    "otherCaTaxes",
    "federalWithheld",
    "federalEstimated",
    "caWithheld",
    "caEstimated",
    "caRefundableCredits",
    "caIsrPenalty"
  ];

  const $ = (id) => document.getElementById(id);

  function raw(id) {
    const el = $(id);
    return el ? String(el.value).trim() : "";
  }

  function num(id) {
    const value = raw(id).replace(/,/g, "");
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function value(id) {
    const el = $(id);
    return el ? el.value : "";
  }

  function money(amount) {
    const rounded = Math.round(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(rounded);
  }

  function rate(value) {
    return Number.isFinite(value) ? value.toFixed(4) : "0.0000";
  }

  function clampRatio(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value));
  }

  function bracketTax(income, brackets) {
    const taxable = Math.max(0, income);
    return brackets.reduce((tax, bracket) => {
      const [floor, ceiling, rateValue] = bracket;
      if (taxable <= floor) return tax;
      return tax + (Math.min(taxable, ceiling) - floor) * rateValue;
    }, 0);
  }

  function chooseDeduction(method, standardAmount, itemizedAmount) {
    if (method === "standard") return standardAmount;
    if (method === "itemized") return itemizedAmount;
    return Math.max(standardAmount, itemizedAmount);
  }

  function balanceText(amount) {
    if (amount > 0) return `需补缴 ${money(amount)}`;
    if (amount < 0) return `预计退款 ${money(Math.abs(amount))}`;
    return "$0";
  }

  function setBalance(id, amount) {
    const el = $(id);
    el.textContent = balanceText(amount);
    el.classList.toggle("due", amount > 0);
    el.classList.toggle("refund", amount < 0);
  }

  function renderRows(id, rows) {
    const body = $(id);
    body.innerHTML = rows.map(([label, value]) => {
      return `<tr><th scope="row">${label}</th><td>${value}</td></tr>`;
    }).join("");
  }

  function statusDefaultPersonalCount(status) {
    if (status === "mfj") return 2;
    return 1;
  }

  function calculate() {
    const filingStatus = value("filingStatus");
    const caMode = value("caMode");

    const federalIncome = num("youWages") + num("spouseWages") + num("otherFederalIncome");
    const federalAgi = Math.max(0, federalIncome - num("federalAdjustments"));
    const federalStandard = DATA.federalStandardDeduction[filingStatus];
    const federalDeduction = chooseDeduction(value("fedDeductionMethod"), federalStandard, num("federalItemized"));
    const federalTaxable = Math.max(0, federalAgi - federalDeduction - num("federalExtraDeductions"));
    const federalTaxBeforeCredits = bracketTax(federalTaxable, DATA.federalBrackets[filingStatus]);
    const federalTax = Math.max(0, federalTaxBeforeCredits - num("federalCredits"));
    const federalPayments = num("federalWithheld") + num("federalEstimated");
    const federalBalance = federalTax - federalPayments;

    const caAllSourceAgi = Math.max(0, federalAgi - num("caSubtractions") + num("caAdditions"));
    const caStandard = DATA.caStandardDeduction[filingStatus];
    const caDeduction = chooseDeduction(value("caDeductionMethod"), caStandard, num("caItemized"));
    const caTotalTaxable = caMode === "none" ? 0 : Math.max(0, caAllSourceAgi - caDeduction);
    const caLine31 = caMode === "none" ? 0 : bracketTax(caTotalTaxable, DATA.caBrackets[filingStatus]);

    const autoCaAgi = Math.max(0, num("caWages") + num("spouseCaWages") + num("caOtherIncome") - num("caSourceAdjustments"));
    let caAgi = raw("caAgiOverride") ? Math.max(0, num("caAgiOverride")) : autoCaAgi;
    if (caMode === "resident") caAgi = caAllSourceAgi;
    if (caMode === "none") caAgi = 0;

    const caDeductionRatio = clampRatio(caAllSourceAgi > 0 ? caAgi / caAllSourceAgi : 0);
    const caProratedDeduction = caDeduction * caDeductionRatio;
    const caTaxable = Math.max(0, caAgi - caProratedDeduction);
    const caEffectiveRate = caTotalTaxable > 0 ? Math.round((caLine31 / caTotalTaxable) * 10000) / 10000 : 0;
    const caTaxBeforeExemptions = caTaxable * caEffectiveRate;

    const exemptionCredit = (num("caPersonalCount") * 153) + (num("caSeniorBlindCount") * 153) + (num("caDependentCount") * 475);
    const caExemptionPercent = clampRatio(caTotalTaxable > 0 ? caTaxable / caTotalTaxable : 0);
    const caProratedExemptions = exemptionCredit * caExemptionPercent;
    const caRegularTax = Math.max(0, caTaxBeforeExemptions - caProratedExemptions - num("caCredits"));
    const caBehavioralHealthTax = Math.max(0, caTaxable - 1000000) * 0.01;
    const caTotalTax = caRegularTax + caBehavioralHealthTax + num("otherCaTaxes") + num("caIsrPenalty");
    const caPayments = num("caWithheld") + num("caEstimated") + num("caRefundableCredits");
    const caBalance = caMode === "none" ? 0 : caTotalTax - caPayments;

    setBalance("federalBalance", federalBalance);
    setBalance("caBalance", caBalance);
    setBalance("combinedBalance", federalBalance + caBalance);
    $("combinedLabel").textContent = federalBalance + caBalance >= 0 ? "预计合计需补缴" : "预计合计退款";

    $("fedAgiMetric").textContent = money(federalAgi);
    $("fedTaxableMetric").textContent = money(federalTaxable);
    $("caTaxableMetric").textContent = money(caTaxable);
    $("caRateMetric").textContent = rate(caEffectiveRate);

    renderRows("federalRows", [
      ["Total income", money(federalIncome)],
      ["AGI", money(federalAgi)],
      [`Standard deduction (${TAX_YEAR})`, money(federalStandard)],
      ["Chosen deduction", money(federalDeduction)],
      ["Extra deductions", money(num("federalExtraDeductions"))],
      ["Taxable income", money(federalTaxable)],
      ["Tax before credits", money(federalTaxBeforeCredits)],
      ["Credits", money(num("federalCredits"))],
      ["Total tax", money(federalTax)],
      ["Payments", money(federalPayments)],
      ["Balance", balanceText(federalBalance)]
    ]);

    renderRows("caRows", [
      ["Return mode", caMode === "mixed" ? "Form 540NR" : caMode === "resident" ? "Form 540 estimate" : "Not estimated"],
      ["Line 17 · AGI all sources", money(caAllSourceAgi)],
      [`CA standard deduction (${TAX_YEAR})`, money(caStandard)],
      ["Line 18 · chosen deduction", money(caDeduction)],
      ["Line 19 · total taxable income", money(caTotalTaxable)],
      ["Line 31 · tax on total taxable", money(caLine31)],
      ["Line 32 · CA AGI", money(caAgi)],
      ["Schedule CA Part IV line 3", rate(caDeductionRatio)],
      ["Line 35 · CA taxable income", money(caTaxable)],
      ["Line 36 · CA tax rate", rate(caEffectiveRate)],
      ["Line 37 · tax before exemptions", money(caTaxBeforeExemptions)],
      ["Line 39 · prorated exemptions", money(caProratedExemptions)],
      ["Line 40 · regular tax", money(caRegularTax)],
      ["Line 72 · Behavioral Health Services Tax", money(caBehavioralHealthTax)],
      ["Total CA tax", money(caTotalTax)],
      ["Payments", money(caPayments)],
      ["Balance", balanceText(caBalance)]
    ]);

    renderChecklist({
      caMode,
      caAgi,
      spouseCaWages: num("spouseCaWages"),
      caBehavioralHealthTax,
      federalItemized: num("federalItemized"),
      caItemized: num("caItemized"),
      filingStatus
    });

    return {
      filingStatus,
      caMode,
      federal: { federalIncome, federalAgi, federalTaxable, federalTax, federalPayments, federalBalance },
      california: { caAllSourceAgi, caAgi, caTotalTaxable, caTaxable, caEffectiveRate, caTotalTax, caPayments, caBalance }
    };
  }

  function renderChecklist(context) {
    const items = [];
    if (context.caMode === "mixed") {
      items.push("你或配偶有一方不是 CA 全年居民时，通常从 Form 540NR 开始核对。");
      items.push("配偶德州工资通常不是 CA 来源收入；若有在 CA 工作日、RSU vest、奖金分摊或 CA-source 1099，请填入 CA 来源收入。");
    }
    if (context.spouseCaWages > 0) {
      items.push("配偶存在 CA 来源工资，请按 W-2 Box 16、工作日分摊或雇主说明核对 Schedule CA (540NR)。");
    }
    if (context.filingStatus === "mfs") {
      items.push("MFS 与 community property 规则会改变收入分配，建议逐项复核而不是只用这个估算。");
    }
    if (context.caBehavioralHealthTax > 0) {
      items.push("CA taxable income 超过 $1,000,000，已加入 Behavioral Health Services Tax。");
    }
    if (context.federalItemized > 0 || context.caItemized > 0) {
      items.push("联邦和加州逐项扣除规则不同，尤其 SALT、SDI、HSA、慈善捐赠限制需要分别核对。");
    }
    if (context.caMode !== "none" && context.caAgi === 0) {
      items.push("当前 CA AGI 为 $0；如果你在加州工作，请填 W-2 Box 16 或手动覆盖 CA AGI。");
    }
    items.push("德州没有在本工具中计算个人州所得税；仍需留意房产税、销售税或个体经营相关税费。");

    $("taxChecklist").innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  }

  function collectInputs(result) {
    const inputs = ids.reduce((acc, id) => {
      acc[id] = raw(id);
      return acc;
    }, {});
    inputs.filingStatus = value("filingStatus");
    inputs.caMode = value("caMode");
    inputs.fedDeductionMethod = value("fedDeductionMethod");
    inputs.caDeductionMethod = value("caDeductionMethod");
    return {
      taxYear: TAX_YEAR,
      generatedAt: new Date().toISOString(),
      inputs,
      result
    };
  }

  function downloadJson() {
    const result = calculate();
    const payload = JSON.stringify(collectInputs(result), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-planner-${TAX_YEAR}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function fillSample() {
    const values = {
      youWages: "220000",
      spouseWages: "160000",
      otherFederalIncome: "5000",
      federalAdjustments: "0",
      caWages: "220000",
      spouseCaWages: "0",
      caOtherIncome: "0",
      caSourceAdjustments: "0",
      caAgiOverride: "",
      federalItemized: "0",
      federalExtraDeductions: "0",
      federalCredits: "0",
      caItemized: "0",
      caSubtractions: "0",
      caAdditions: "0",
      caCredits: "0",
      caPersonalCount: "2",
      caDependentCount: "0",
      caSeniorBlindCount: "0",
      otherCaTaxes: "0",
      federalWithheld: "65000",
      federalEstimated: "0",
      caWithheld: "18000",
      caEstimated: "0",
      caRefundableCredits: "0",
      caIsrPenalty: "0"
    };
    Object.entries(values).forEach(([id, inputValue]) => {
      const el = $(id);
      if (el) el.value = inputValue;
    });
    $("filingStatus").value = "mfj";
    $("caMode").value = "mixed";
    $("fedDeductionMethod").value = "auto";
    $("caDeductionMethod").value = "auto";
    calculate();
  }

  function bind() {
    const form = $("taxForm");
    if (!form) return;

    form.addEventListener("input", calculate);
    form.addEventListener("change", (event) => {
      if (event.target.id === "filingStatus") {
        $("caPersonalCount").value = String(statusDefaultPersonalCount(event.target.value));
      }
      calculate();
    });
    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        $("caPersonalCount").value = "2";
        calculate();
      }, 0);
    });

    $("printBtn").addEventListener("click", () => window.print());
    $("downloadBtn").addEventListener("click", downloadJson);
    $("sampleBtn").addEventListener("click", fillSample);

    calculate();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
