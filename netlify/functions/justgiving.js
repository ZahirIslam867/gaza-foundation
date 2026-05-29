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

    // Donation summary — totalAmount is a float in pounds (e.g. 618.24)
    var summaryMatch = html.match(
      /\\"donationSummary\\":\{\\"totalAmount\\":([\d.]+),\\"aggregatedDonationsCount\\":(\d+)\}/
    );
    var totalAmount = summaryMatch ? Math.round(parseFloat(summaryMatch[1], 10)) : 0;
    var donationCount = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;

    // Target amount (integer pounds, e.g. 2000)
    var targetMatch = html.match(/\\"targetAmount\\":(\d+)/);
    var targetAmount = targetMatch ? parseInt(targetMatch[1], 10) : null;

    // Recent donations — extract from the \"nodes\":[{...}] donation array
    var donations = [];
    var nodesStart = html.indexOf('\\"nodes\\":[{\\"id\\":\\"RG9uYXRpb');
    if (nodesStart >= 0) {
      var section = html.substring(nodesStart);
      var donorPat = /\\"id\\":\\"(?:RG9uYXRpb[^"]+|[a-f0-9-]{36})\\"[\s\S]*?\\"amount\\":\{\\"value\\":(\d+)[\s\S]*?\\"displayName\\":\\"([^"]+)\\"[\s\S]*?\\"message\\":\\"([^"]*)\\"/g;
      var seen = {};
      var m;
      while ((m = donorPat.exec(section)) !== null) {
        var key = m[2] + '|' + m[3];
        if (!seen[key]) {
          seen[key] = true;
          donations.push({
            displayName: m[2],
            message: m[3],
            amount: parseInt(m[1], 10), // in pence (15000 = £150.00)
          });
        }
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
