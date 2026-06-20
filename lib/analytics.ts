import { sendGTMEvent } from "@next/third-parties/google";

const isBrowser = () => typeof window !== "undefined";

interface CTAEventParams {
  text: string;
  location: string;
  url?: string;
}

export const trackCTA = ({ text, location, url }: CTAEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "cta_click",
    cta_text: text,
    cta_location: location,
    cta_url: url || "",
  });
};

interface CalculatorParams {
  coverAmount: number;
  dependents: number;
  estimatedPremium: number;
}

export const trackCalculatorEstimate = ({
  coverAmount,
  dependents,
  estimatedPremium,
}: CalculatorParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "calculator_estimate",
    cover_amount: coverAmount,
    dependents_count: dependents,
    estimated_premium: estimatedPremium,
  });
};

interface PageViewParams {
  url: string;
}

export const trackPageView = ({ url }: PageViewParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "pageView",
    page_path: url,
  });
};

interface AuthEventParams {
  location?: string;
}

export const trackSignUpSubmit = ({ location }: AuthEventParams = {}) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "sign_up_submit",
    form_location: location || "",
  });
};

export const trackLoginSubmit = () => {
  if (!isBrowser()) return;
  sendGTMEvent({ event: "login_submit" });
};

export const trackSignUpSuccess = () => {
  if (!isBrowser()) return;
  sendGTMEvent({ event: "sign_up_success" });
};

interface ApplicationEventParams {
  product: string;
  stepIndex?: number;
  stepName?: string;
  stepTotal?: number;
  message?: string;
}

export const trackApplicationStart = ({ product }: ApplicationEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "application_start",
    product,
  });
};

export const trackApplicationStepComplete = ({
  product,
  stepIndex,
  stepName,
  stepTotal,
}: ApplicationEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "application_step_complete",
    product,
    step_index: stepIndex,
    step_name: stepName,
    step_total: stepTotal,
  });
};

export const trackApplicationSubmit = ({ product }: ApplicationEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "application_submit",
    product,
  });
};

export const trackApplicationSuccess = ({ product }: ApplicationEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "application_success",
    product,
  });
};

export const trackApplicationError = ({
  product,
  message,
}: ApplicationEventParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "application_error",
    product,
    error_message: message,
  });
};

interface PlanSelectedParams {
  packageId: string;
  packageName: string;
  planType: string;
  coverAmount: number;
  monthlyPremium: number;
  dependentsCovered: number;
}

export const trackPlanSelected = ({
  packageId,
  packageName,
  planType,
  coverAmount,
  monthlyPremium,
  dependentsCovered,
}: PlanSelectedParams) => {
  if (!isBrowser()) return;
  sendGTMEvent({
    event: "plan_selected",
    package_id: packageId,
    package_name: packageName,
    plan_type: planType,
    cover_amount: coverAmount,
    monthly_premium: monthlyPremium,
    dependents_covered: dependentsCovered,
  });
  trackCalculatorEstimate({
    coverAmount,
    dependents: dependentsCovered,
    estimatedPremium: monthlyPremium,
  });
};
