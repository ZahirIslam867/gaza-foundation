function decodeRsc(html) {
  var segments = [];
  var idx = 0;
  while ((idx = html.indexOf('__next_f.push([1,', idx)) !== -1) {
    var start = idx + 18 + 1;
    var i = start;
    while (i < html.length) {
      if (html[i] === '\\') i += 2;
      else if (html[i] === '"') break;
      else i++;
    }
    if (i > start) {
      var raw = html.substring(start, i);
      segments.push(
        raw.replace(/\\([\\"nrt])/g, function (_, c) {
          return c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c;
        })
      );
    }
    idx = i + 3;
  }
  return segments.join('');
}

exports.handler = async function () {
  try {
    var res = await fetch('https://www.justgiving.com/page/gaza-fundraising-cause', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    var html = await res.text();
    var rsc = decodeRsc(html);

    // Donation summary — totalAmount is a float in pounds (e.g. 618.24)
    var summaryMatch = html.match(
      /\\"donationSummary\\":\{\\"totalAmount\\":([\d.]+),\\"aggregatedDonationsCount\\":(\d+)\}/
    );
    var totalAmount = summaryMatch ? Math.round(parseFloat(summaryMatch[1], 10)) : 0;
    var donationCount = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;

    // Target amount (integer pounds, e.g. 2000)
    var targetMatch = html.match(/\\"targetAmount\\":(\d+)/);
    var targetAmount = targetMatch ? parseInt(targetMatch[1], 10) : null;

    // Recent donations from decoded RSC
    // Format: "amount":{"value":3750,"currencyCode":"GBP"},"displayName":"NAME","avatar":"","message":"MSG"
    var donations = [];
    var seen = {};
    var donorPat = /"amount":\{"value":(\d+)[^}]+"displayName":"([^"]+)"[^}]+"message":"([^"]*)"/g;
    var m;
    while ((m = donorPat.exec(rsc)) !== null) {
      var key = m[2] + '|' + m[3];
      if (!seen[key]) {
        seen[key] = true;
        donations.push({
          displayName: m[2],
          message: m[3],
          amount: parseInt(m[1], 10), // in pence (3750 = £37.50)
        });
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        totalAmount: totalAmount,
        donationCount: donationCount,
        targetAmount: targetAmount,
        recentDonations: donations,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
