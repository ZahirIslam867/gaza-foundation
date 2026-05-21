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

    // Donation summary (escaped quotes in RSC payload)
    var summaryMatch = html.match(
      /\\"donationSummary\\":\{\\"totalAmount\\":(\d+),\\"aggregatedDonationsCount\\":(\d+)\}/
    );
    var totalAmount = summaryMatch ? parseInt(summaryMatch[1], 10) : 0;
    var donationCount = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;

    // Target amount
    var targetMatch = html.match(/\\"targetAmount\\":(\d+)/);
    var targetAmount = targetMatch ? parseInt(targetMatch[1], 10) : null;

    // Value refs from decoded RSC
    var refs = {};
    var refPat = /(\w+):\{"value":(\d+)/g;
    var m;
    while ((m = refPat.exec(rsc)) !== null) refs[m[1]] = parseInt(m[2], 10);

    // Recent donations (from decoded RSC with amounts)
    var donations = [];
    var seen = {};

    // Pattern: "amount":"$XX","giftAidAmount":"$YY","displayName":"NAME","avatar":"","message":"MSG"
    var refDonorPat = /"amount":"\$(\w+)"[^}]+"displayName":"([^"]+)"[^}]+"message":"([^"]*)"/g;
    while ((m = refDonorPat.exec(rsc)) !== null) {
      var key = m[2] + '|' + m[3];
      if (!seen[key]) {
        seen[key] = true;
        var amt = refs[m[1]] || 0;
        donations.push({ displayName: m[2], message: m[3], amount: amt });
      }
    }

    // Pattern: "amount":null, ... "displayName":"NAME",...,"message":"MSG"
    // Only add if not already found with amount
    var nullDonorPat = /"amount":null[^}]+"displayName":"([^"]+)"[^}]+"message":"([^"]*)"/g;
    while ((m = nullDonorPat.exec(rsc)) !== null) {
      var key = m[1] + '|' + m[2];
      if (!seen[key]) {
        seen[key] = true;
        donations.push({ displayName: m[1], message: m[2], amount: 0 });
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
