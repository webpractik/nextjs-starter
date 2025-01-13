module.exports = {
    validate: {
        plugins: ['@statoscope/webpack'],
        reporters: [['@statoscope/stats-report', { saveReportTo: 'report/statoscope/index.html' }]],
        rules: {
            '@statoscope/webpack/build-time-limits': ['error', 120000],
            // ensures that bundle doesn't use specified packages
            '@statoscope/webpack/restricted-packages': ['error', ['jquery', 'moment']],
            // ensures that bundle hasn't package duplicates
            '@statoscope/webpack/no-packages-dups': ['error'],
            // ensure that the download time of entrypoints is not over the limit (3 sec)
            '@statoscope/webpack/entry-download-time-limits': [
                'error',
                { global: { maxDownloadTime: 3000 } },
            ],
            // ensure that the download size of entrypoints is not over the limit (3 mb)
            '@statoscope/webpack/entry-download-size-limits': [
                'error',
                { global: { maxSize: 3 * 1024 * 1024 } },
            ],
            // compares build time between input and reference stats. Fails if build time diff is the limit (3 sec)
            '@statoscope/webpack/diff-build-time-limits': ['error', 3000],
            // diff download size of entrypoints between input and reference stats. Fails if size diff is over the limit (3 kb)
            '@statoscope/webpack/diff-entry-download-size-limits': [
                'error',
                { global: { maxSizeDiff: 3 * 1024 } },
            ],
            // diff download time of entrypoints between input and reference stats. Fails if download time is over the limit (500 ms)
            '@statoscope/webpack/diff-entry-download-time-limits': [
                'error',
                { global: { maxDownloadTimeDiff: 500 } },
            ],
            // compares usage of specified modules between input and reference stats
            '@statoscope/webpack/diff-deprecated-modules': ['error', [/\/path\/to\/module\.js/]],
            // compares usage of specified packages usage between input and reference stats.
            '@statoscope/webpack/diff-deprecated-packages': ['error', ['moment']],
        },
    },
};
