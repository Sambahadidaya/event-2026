fokus ke halaman panduan yang tepatnya pada saat mendownload video.
saya ingin pakai pihak ketiga https://y2mate.gs/ saja yang tampilan websitenya ada pada log/y2mate.png dan codingan websitenya seperti ini ;
<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="description" content="Convert YouTube videos to MP3 or MP4 files and download them for free with the Y2Mate YouTube to MP3 converter. No sign-up or subscription required.">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Y2Mate - Free YouTube to MP3 Converter</title>
        <link rel="alternate" hreflang="en" href="https://y2mate.gs/">
        <link rel="alternate" hreflang="es" href="https://y2mate.gs/es/">
        <link rel="alternate" hreflang="fr" href="https://y2mate.gs/fr/">
        <link rel="alternate" hreflang="it" href="https://y2mate.gs/it/">
        <link rel="alternate" hreflang="pt" href="https://y2mate.gs/pt/">
        <link rel="alternate" hreflang="x-default" href="https://y2mate.gs/">
        <link rel="canonical" href="https://y2mate.gs/">
        <style>
            body {
                background-color: #fafafa;
                background-image: linear-gradient(#121212 168px, transparent 168px);
                background-repeat: no-repeat;
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin: 0;
            }

            input, button {
                font-family: inherit;
            }

            .header {
                max-width: 600px;
                margin: 0 auto;
                padding-top: 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .header span {
                color: #ffffff;
                font-size: 24px;
            }

            .header a {
                color: #b4b4b4;
                text-decoration: none;
                margin-right: 16px;
            }

            .header a:last-child {
                margin-right: 0;
            }

            form {
                background-color: #ffffff;
                max-width: 600px;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
                margin: 32px auto 0 auto;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                box-sizing: border-box;
            }

            form button, form input {
                height: 48px;
                border-radius: 6px;
            }

            .form__title {
                color: #363636;
                font-size: 14px;
                font-weight: bold;
                line-height: 16px;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }

            .form__input input {
                color: #595959;
                background-color: #fafafa;
                font-size: 16px;
                width: 100%;
                border: 1px solid #e2e2e2;
                padding: 0 12px;
                outline: none;
                box-sizing: border-box;
            }

            .form__actions {
                display: flex;
                justify-content: space-between;
            }

            .form__formats {
                background-color: #fafafa;
                border: 1px solid #e2e2e2;
                height: 48px;
                border-radius: 6px;
                padding: 6px;
                display: flex;
                align-items: center;
                gap: 6px;
                box-sizing: border-box;
            }

            .form__formats button[type="button"] {
                color: #494949;
                background-color: transparent;
                font-size: 14px;
                border: none;
                border-radius: 4px;
                height: 34px;
                padding: 0 24px;
                cursor: pointer;
            }

            .form__formats button[type="button"].active {
                color: #ffffff;
                background-color: #121212;
            }

            .form__actions button[type="submit"] {
                color: #ffffff;
                background-color: #d62828;
                font-size: 16px;
                border: none;
                cursor: pointer;
                padding: 0 24px;
            }

            .form__input--progress {
                color: #595959;
                background-color: #fafafa;
                width: 100%;
                height: 48px;
                border: 1px solid #e2e2e2;
                border-radius: 6px;
                padding: 0 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: left;
                box-sizing: border-box;
            }

            .form__loader {
                width: 16px;
                height: 16px;
                border: 2px solid #e2e2e2;
                border-top-color: #d62828;
                border-radius: 50%;
                display: inline-block;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .form__actions--download {
                display: flex;
                justify-content: space-between;
            }

            .form__actions--download button.more {
                color: #363636;
                background-color: #ffffff;
                font-size: 16px;
                border: 1px solid #e2e2e2;
                padding: 0 12px;
                cursor: pointer;
            }

            .form__actions--download button.more:disabled {
                color: #b4b4b4;
                background-color: #fafafa;
                cursor: not-allowed;
            }

            .form__actions--download button.download {
                color: #ffffff;
                background-color: #d62828;
                font-size: 16px;
                border: none;
                padding: 0 24px;
                cursor: pointer;
            }

            .form__actions--download button.download:disabled {
                cursor: not-allowed;
                opacity: 0.4;
            }

            .form__error--title {
                color: #363636;
                font-size: 14px;
                font-weight: bold;
                line-height: 16px;
            }

            .form__error--message {
                color: #595959;
                background-color: #fafafa;
                font-size: 16px;
                line-height: 48px;
                height: 48px;
                border: 1px solid #e2e2e2;
                border-radius: 6px;
                padding: 0 12px;
                box-sizing: border-box;
            }

            .form__error--button {
                display: flex;
                gap: 12px;
                justify-content: right;
            }

            .form__error--button button {
                color: #ffffff;
                background-color: #d62828;
                font-size: 16px;
                border: none;
                padding: 0 24px;
                cursor: pointer;
            }

            .text {
                color: #494949;
                max-width: 600px;
                margin: 48px auto 0 auto;
            }

            .text h1 {
                color: #363636;
                font-size: 24px;
                line-height: 24px;
                margin: 0;
            }

            .text p {
                font-size: 14px;
                line-height: 24px;
                margin: 16px 0 0 0;
            }

            .text p.b {
                font-weight: bold;
            }

            .text a {
                color: #494949;
            }

            .text ol {
                list-style-position: inside;
                margin: 8px 0 0 0;
                padding: 0;
            }

            .text li {
                line-height: 24px;
                margin-bottom: 4px;
            }

            .text li::marker {
                font-weight: bold;
            }

            .text li:last-child {
                margin-bottom: 0;
            }

            .footer {
                border-top: 1px solid #e2e2e2;
                margin-top: 48px;
            }

            .footer div {
                text-align: center;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px 0;
            }

            .footer a {
                color: #363636;
                text-decoration: none;
                margin: 0 8px;
            }

            @media (max-width: 600px) {
                .header {
                    padding:16px 4% 0 4%;
                }

                .header a:nth-of-type(3), .header a:nth-of-type(4) {
                    display: none;
                }

                form {
                    margin: 32px 4% 0 4%;
                }

                .text {
                    margin: 48px 4% 0 4%;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <img src="/svg/1785442237/logo.svg" width="174" height="42" alt="Y2Mate">
            </div>
            <div>
                <a href="/">Home</a>
                <a href="/faq/">FAQ</a>
                <a href="/add-on/">Add-On</a>
                <a href="/bookmarklet/">Bookmarklet</a>
            </div>
        </div>
        <form autocomplete="off" method="post">
            <div class="form__title">
                <label for="video">Paste your YouTube link</label>
            </div>
            <div class="form__input">
                <input id="video" type="text" name="video" placeholder="youtube.com/watch?v=Y2MaTeR0cKs" required autofocus>
            </div>
            <div class="form__actions">
                <div class="form__formats">
                    <button type="button" class="active">MP3</button>
                    <button type="button">MP4</button>
                </div>
                <button type="submit">Convert</button>
            </div>
        </form>
        <div class="text">
            <h1>YouTube to MP3 Converter</h1>
            <p>
                Y2Mate is an easy way to download YouTube videos as MP3 or MP4 files. Y2Mate is free to use and does not require any sign-up or subscription. It is optimized to run on all common devices such as computers, tablets, and mobile phones — the only requirement is a modern browser. By using Y2Mate, you accept our <a href="/terms-of-use/">Terms of Use</a>
                .
            </p>
            <p>How to download a YouTube video</p>
            <ol>
                <li>Go to YouTube.com and find a video you would like to download.</li>
                <li>
                    Copy the link of the YouTube video. You'll find a list of all supported YouTube video links on our <a href="/faq/">FAQ page</a>
                    .
                </li>
                <li>Paste the video link into our YouTube to MP3 converter above.</li>
                <li>Select a download format. You can choose between MP3 and MP4.</li>
                <li>Click the &ldquo;Convert &rdquo;button to start the conversion.</li>
                <li>Depending on the length of the video and the chosen format, the conversion may take up to several minutes. As soon as the conversion is finished, you can download the file by clicking the &ldquo;Download &rdquo;button.</li>
            </ol>
            <p>We hope you enjoy using Y2Mate!</p>
        </div>
        <div class="footer">
            <div>
                <a href="/contact/">Contact</a>
                <a href="/copyright-claims/">Copyright Claims</a>
                <a href="/privacy-policy/">Privacy Policy</a>
                <a href="/terms-of-use/">ToU</a>
            </div>
        </div>
        <script src="/js/1785442237/y2mate.js" defer></script>
    </body>
</html>
