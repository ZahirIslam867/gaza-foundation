exports.handler = async function () {
  try {
    var res = await fetch('https://www.justgiving.com/page/gaza-fundraising-cause', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    var html = await res.text();

    // Donation summary (escaped quotes in RSC payload)
    var summaryMatch = html.match(
      /\\"donationSummary\\":\{\\"totalAmount\\":(\d+),\\"aggregatedDonationsCount\\":(\d+)\}/
    );
    var totalAmount = summaryMatch ? parseInt(summaryMatch[1], 10) : 0;
    var donationCount = summaryMatch ? parseInt(summaryMatch[2], 10) : 0;

    // Target amount
    var targetMatch = html.match(/\\"targetAmount\\":(\d+)/);
    var targetAmount = targetMatch ? parseInt(targetMatch[1], 10) : null;

    // Recent donations (deduplicated)
    var donorRegex =
      /\\"displayName\\":\\"([^"\\]+)\\",\\"avatar\\":\\"[^"]*\\",\\"message\\":\\"([^"\\]*)\\"/g;
    var donations = [];
    var seen = {};
    var match;
    while ((match = donorRegex.exec(html)) !== null) {
      var key = match[1] + '|' + match[2];
      if (!seen[key]) {
        seen[key] = true;
        donations.push({
          displayName: match[1],
          message: match[2],
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
