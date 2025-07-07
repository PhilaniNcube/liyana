import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      idNumber,
      forename,
      surname,
      gender,
      dateOfBirth,
      address1,
      address2,
      address3,
      address4,
      postalCode,
      homeTelCode,
      homeTelNo,
      workTelNo,
      cellTelNo,
      workTelCode,
    } = await request.json();

    if (!idNumber) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    const userName = process.env.EXPERIAN_USERNAME!;
    const password = process.env.EXPERIAN_PASSWORD!;

    if (!userName || !password) {
      console.error(
        "Experian credentials are not set in environment variables."
      );
      return NextResponse.json(
        { error: "Experian credentials are not configured" },
        { status: 500 }
      );
    }

    const apiURL =
      "https://apis-uat.experian.co.za:9443/nsv2/NormalSearchService";

    const requestBody = {
      username: userName,
      password: password,
      myOrigin: "QATEST",
      dllVersion: "1",
      searchCriteria: {
        publicDomainSearch: "Y",
        csData: "N",
        cpaPlusNLRData: "N",
        deeds: "N",
        directors: "N",
        runCompuScore: "Y",
        runCodix: "N",
        codixParams:
          "<PARAMS><PARAM_NAME>MonthsSinceEmployed</PARAM_NAME><PARAM_VALUE>12</PARAM_VALUE></PARAMS><PARAMS><PARAM_NAME>IncomePM</PARAM_NAME><PARAM_VALUE>7000</PARAM_VALUE></PARAMS><PARAMS><PARAM_NAME>RunBehaviourScore</PARAM_NAME><PARAM_VALUE>N</PARAM_VALUE></PARAMS>",
        passportFlag: "N",
        identity_number: idNumber,
        forename: forename || "",
        forename2: "",
        forename3: "",
        surname: surname || "",
        gender: gender || "",
        dateOfBirth: dateOfBirth || "",
        address1: address1 || "",
        address2: address2 || address4 || "",
        address3: address3 || "",
        address4: address4 || "",
        postalCode: postalCode || "",
        homeTelCode: homeTelCode || "",
        homeTelNo: homeTelNo || "",
        workTelNo: workTelNo || "",
        cellTelNo: cellTelNo || "",
        workTelCode: workTelCode || "",
        clientConsent: "Y",
        adrs_Mandatory: "Y",
        resultType: "XML",
        enqPurpose: "12",
      },
    };

    console.log("Sending fraud check request to:", apiURL);

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Error fetching fraud check data:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch fraud check data" },
        { status: response.status }
      );
    }

    const data = await response.text();
    console.log("Fraud check data received:", data);

    return NextResponse.json(
      {
        results: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fraud check error:", error);
    return NextResponse.json(
      { error: "Internal server error during fraud check" },
      { status: 500 }
    );
  }
}
