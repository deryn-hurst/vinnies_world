if(!sessionStorage.getItem("authenticated") && document.title !== "Welcome to Vinnie's World!"){
    alert("You are not authorized to access this page. Redirecting to home.");
    location.href = "index.html";
}


// integrating text to speech
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.maxAlternatives = 1;

const CORRECT_PASSWORD = "0652676b73a14c9e162246927f4e74a20ade172ac5623f7f18c76e0130820a62";

if(document.title === "Welcome to Vinnie's World!"){
    async function checkPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    document.getElementById("enter").addEventListener("click", async function () {
        let pass = prompt("Enter password");
        while(await checkPassword(pass) !== CORRECT_PASSWORD.toString()){
            pass = prompt("Incorrect password. Re-enter password");
        }
        sessionStorage.setItem("authenticated", true);
        location.href = "islands.html";
    });
}

if(document.title === "Oto Island") {
    const control_button = document.getElementById('control_transcription');
    control_button.addEventListener('click', function () {
        if(control_button.innerHTML === 'START'){
            control_button.innerHTML = 'STOP';

            recognition.start(); // start listening
            
            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                document.getElementById("transcript_label").innerHTML += transcript + ".<br><br>";
            };

            recognition.onerror = (event) => {
                console.error("Error: ", event.error);
                control_button.innerHTML = 'START';
            }
        }
        else {
            control_button.innerHTML = 'START';

            recognition.stop();
            // pull transcript
            let transcript = document.getElementById("transcript_label").innerHTML;

            // pull and clean transcript
            transcript = transcript.replaceAll("<br>", "\n");

            const blob = new Blob([transcript], {type: 'text/plain'});
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.style.display = 'none';
            link.href = url;
            link.download = "oto_island_transcript.txt";

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            }
    });
}