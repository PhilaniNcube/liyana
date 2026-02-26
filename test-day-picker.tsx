import React from "react";
import { renderToString } from "react-dom/server";
import { DayPicker } from "react-day-picker";

console.log(renderToString(<DayPicker />));
