import test from "node:test";
import assert from "node:assert/strict";
import { getProgramPriceLabel, isFreeProgramItem } from "../src/utils/programDisplay.js";

test("Paid Programs are not mistaken for Free when their compatibility fee is zero", () => {
  const program = { pricingType: "Paid", programFee: 0 };
  assert.equal(isFreeProgramItem(program), false);
  assert.equal(getProgramPriceLabel(program), "Price unavailable");
});

test("Program cards show the configured lowest price and identify multiple options", () => {
  assert.equal(getProgramPriceLabel({
    pricingType: "Paid",
    pricingPlans: [
      { price: 1299, active: true },
      { price: 499, active: true },
      { price: 99, active: false },
    ],
  }), "From ₹499");
  assert.equal(getProgramPriceLabel({ pricingType: "Paid", programFee: 799 }), "₹799");
});

test("Program cards identify Monthly and Annual plan prices", () => {
  assert.equal(getProgramPriceLabel({
    pricingType: "Paid",
    pricingPlans: [
      { price: 499, billingPeriod: "Monthly", active: true },
      { price: 899, billingPeriod: "Monthly", active: true },
      { price: 4999, billingPeriod: "Annual", active: true },
    ],
  }), "Monthly ₹499 · Annual ₹4,999");
});

test("Free and legacy Program pricing labels remain supported", () => {
  assert.equal(getProgramPriceLabel({ pricingType: "Free", programFee: 0 }), "FREE");
  assert.equal(getProgramPriceLabel({ price: "Free" }), "FREE");
});
