/**
 * Tabuada Master - Interactive Application Logic
 * Feature Scope: Mobile-first navigation, interactive tables, Web Speech synthesis,
 * randomized 10-question quiz engine, visual feedback, and local storage state persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === STATE MANAGEMENT ===
    const state = {
        currentTable: 1,
        activeTab: 'sec-study',
        quiz: {
            isActive: false,
            difficulty: 'facil',
            questions: [],
            currentIndex: 0,
            correctCount: 0,
            wrongCount: 0,
            answers: [] // Track details of user answers
        },
        history: JSON.parse(localStorage.getItem('tabuada_master_history')) || []
    };

    // === DOM ELEMENTS ===
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    // Study Room Elements
    const gridNumbers = document.querySelector('.grid-numbers');
    const currentTableNumText = document.getElementById('current-table-num');
    const tableEntriesContainer = document.getElementById('table-entries');
    const btnListen = document.getElementById('btn-listen');
    
    // Quiz Elements
    const quizStartScreen = document.getElementById('quiz-start-screen');
    const quizActiveScreen = document.getElementById('quiz-active-screen');
    const quizResultScreen = document.getElementById('quiz-result-screen');
    
    const btnStartQuiz = document.getElementById('btn-start-quiz');
    const btnRestartQuiz = document.getElementById('btn-restart-quiz');
    const btnGoHistory = document.getElementById('btn-go-history');
    
    const currentQuestionIndexText = document.getElementById('current-question-index');
    const currentCorrectCountText = document.getElementById('current-correct-count');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    
    const quizNum1 = document.getElementById('quiz-num1');
    const quizNum2 = document.getElementById('quiz-num2');
    const quizAnswerInput = document.getElementById('quiz-answer-input');
    const btnSubmitAnswer = document.getElementById('btn-submit-answer');
    const quizFeedback = document.getElementById('quiz-feedback');
    
    const resultEmoji = document.getElementById('result-emoji');
    const resultTitle = document.getElementById('result-title');
    const resultSubtitle = document.getElementById('result-subtitle');
    const resultScoreText = document.getElementById('result-score');
    const resultCorrectText = document.getElementById('result-correct');
    const resultWrongText = document.getElementById('result-wrong');
    
    // Difficulty Elements
    const diffButtons = document.querySelectorAll('.diff-btn');
    const diffDesc = document.getElementById('difficulty-desc');
    
    // Stats & History Elements
    const statsAvgScore = document.getElementById('stats-avg-score');
    const statsTotalTests = document.getElementById('stats-total-tests');
    const statsSuccessRate = document.getElementById('stats-success-rate');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const historyEmpty = document.getElementById('history-empty');
    const historyItems = document.getElementById('history-items');


    // === NAVIGATION ENGINE ===
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            switchTab(target);
        });
    });

    function switchTab(tabId) {
        state.activeTab = tabId;
        
        // Update Nav Menu UI
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Visible Sections
        sections.forEach(sec => {
            if (sec.id === tabId) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // If switching to History tab, make sure stats are fresh
        if (tabId === 'sec-history') {
            renderHistoryAndStats();
        }
        
        // Reset Speech synthesis if active
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            btnListen.textContent = '🔊';
        }
    }


    // === STUDY MODULE (TABUADA) ===
    function initStudyTab() {
        // Generate selector buttons from 1 to 10
        gridNumbers.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = `number-btn ${i === state.currentTable ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                // Remove active from previous
                document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                state.currentTable = i;
                renderTable(i);
                
                // Cancel any ongoing speech
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    btnListen.textContent = '🔊';
                }
            });
            gridNumbers.appendChild(btn);
        }
        
        // Render default table (1)
        renderTable(state.currentTable);
    }

    function renderTable(num) {
        currentTableNumText.textContent = num;
        tableEntriesContainer.innerHTML = '';
        
        for (let i = 1; i <= 10; i++) {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <span>${num} <span class="row-multiplier">×</span> ${i}</span>
                <span class="row-result">${num * i}</span>
            `;
            tableEntriesContainer.appendChild(row);
        }
    }

    // Text to Speech logic (Wow factor)
    btnListen.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            btnListen.textContent = '🔊';
            return;
        }

        btnListen.textContent = '⏹️';
        const num = state.currentTable;
        let utterances = [];

        // Synthesize full times table lines
        for (let i = 1; i <= 10; i++) {
            const text = `${num} vezes ${i} é igual a ${num * i}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            
            if (i === 10) {
                utterance.onend = () => {
                    btnListen.textContent = '🔊';
                };
            }
            
            utterances.push(utterance);
        }

        // Cancel voice queue when synthesis ends or starts anew
        speechSynthesis.cancel();
        utterances.forEach(utt => speechSynthesis.speak(utt));
    });


    // === DIFFICULTY SELECTION ===
    const diffDescriptions = {
        facil: 'Qualquer conta de 1 a 10 sem restrições.',
        medio: 'Sem as tabuadas do 1 e do 10 e excluindo multiplicações por 1 e 10.',
        dificil: 'Sem as tabuadas do 1, 2, 3 e 10 e excluindo multiplicações por 1, 2, 3 e 10.'
    };

    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const level = btn.getAttribute('data-level');
            
            // Update active style
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Save state & update text
            state.quiz.difficulty = level;
            diffDesc.textContent = diffDescriptions[level];
        });
    });

    // === QUIZ ENGINE ===
    btnStartQuiz.addEventListener('click', startQuiz);
    btnRestartQuiz.addEventListener('click', startQuiz);
    btnGoHistory.addEventListener('click', () => switchTab('sec-history'));
    
    btnSubmitAnswer.addEventListener('click', processAnswerSubmission);
    
    // Support "Enter" key on input
    quizAnswerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            processAnswerSubmission();
        }
    });

    function startQuiz() {
        state.quiz.isActive = true;
        state.quiz.currentIndex = 0;
        state.quiz.correctCount = 0;
        state.quiz.wrongCount = 0;
        state.quiz.questions = generateQuizQuestions();
        state.quiz.answers = [];

        // UI transitions
        quizStartScreen.classList.remove('active');
        quizResultScreen.classList.remove('active');
        quizActiveScreen.classList.add('active');

        loadQuizQuestion();
    }

    function generateQuizQuestions() {
        const pool = [];
        const difficulty = state.quiz.difficulty || 'facil';

        // Generate all possible questions based on difficulty filters
        for (let i = 1; i <= 10; i++) {
            for (let j = 1; j <= 10; j++) {
                if (difficulty === 'medio') {
                    // Exclude times tables of 1 and 10, and also multiplying by 1 or 10
                    if (i === 1 || i === 10 || j === 1 || j === 10) {
                        continue;
                    }
                } else if (difficulty === 'dificil') {
                    // Exclude times tables of 1, 2, 3 and 10, and also multiplying by 1, 2, 3 or 10
                    if (i === 1 || i === 2 || i === 3 || i === 10 || j === 1 || j === 2 || j === 3 || j === 10) {
                        continue;
                    }
                }
                pool.push({ num1: i, num2: j, answer: i * j });
            }
        }

        // Pick 10 unique questions randomly
        const selected = [];
        while (selected.length < 10 && pool.length > 0) {
            const randIndex = Math.floor(Math.random() * pool.length);
            selected.push(pool.splice(randIndex, 1)[0]);
        }
        return selected;
    }

    function loadQuizQuestion() {
        const currentQ = state.quiz.questions[state.quiz.currentIndex];
        
        // Update text labels
        currentQuestionIndexText.textContent = state.quiz.currentIndex + 1;
        currentCorrectCountText.textContent = state.quiz.correctCount;
        
        // Progress bar updates
        const progressPercent = ((state.quiz.currentIndex) / 10) * 100;
        quizProgressBar.style.width = `${progressPercent}%`;

        // Update Math display
        quizNum1.textContent = currentQ.num1;
        quizNum2.textContent = currentQ.num2;

        // Clear input and focus
        quizAnswerInput.value = '';
        quizAnswerInput.focus();
        
        // Hide feedback
        quizFeedback.className = 'feedback-msg hidden';
    }

    function processAnswerSubmission() {
        const userAnswer = parseInt(quizAnswerInput.value.trim(), 10);
        
        // Input validation
        if (isNaN(userAnswer)) {
            showInlineFeedback('Por favor, digite um número!', 'incorrect');
            return;
        }

        const currentQ = state.quiz.questions[state.quiz.currentIndex];
        const isCorrect = userAnswer === currentQ.answer;

        // Register action result
        if (isCorrect) {
            state.quiz.correctCount++;
            showInlineFeedback('✓ Correto! Excelente.', 'correct');
        } else {
            state.quiz.wrongCount++;
            showInlineFeedback(`✗ Incorreto! O correto era ${currentQ.answer}.`, 'incorrect');
        }

        // Lock button temporarily to let user read the feedback
        btnSubmitAnswer.disabled = true;
        quizAnswerInput.disabled = true;

        setTimeout(() => {
            btnSubmitAnswer.disabled = false;
            quizAnswerInput.disabled = false;
            
            // Advance or finalize quiz
            state.quiz.currentIndex++;
            if (state.quiz.currentIndex < 10) {
                loadQuizQuestion();
            } else {
                finalizeQuiz();
            }
        }, 1500);
    }

    function showInlineFeedback(msg, type) {
        quizFeedback.textContent = msg;
        quizFeedback.className = `feedback-msg ${type}`;
    }

    function finalizeQuiz() {
        state.quiz.isActive = false;
        
        // Complete the progress bar fill
        quizProgressBar.style.width = '100%';
        
        // Calculate score from 0.0 to 10.0
        const finalScore = state.quiz.correctCount;
        
        // Show result stats in the final screen
        resultScoreText.textContent = finalScore.toFixed(1);
        resultCorrectText.textContent = state.quiz.correctCount;
        resultWrongText.textContent = state.quiz.wrongCount;

        // Tailor emojis/feedback messages to the performance
        if (finalScore === 10) {
            resultEmoji.textContent = '🏆';
            resultTitle.textContent = 'Perfeito! Espetacular!';
            resultSubtitle.textContent = 'Você dominou completamente o teste da tabuada!';
        } else if (finalScore >= 8) {
            resultEmoji.textContent = '🎉';
            resultTitle.textContent = 'Excelente Trabalho!';
            resultSubtitle.textContent = 'Você tem ótimos conhecimentos na tabuada.';
        } else if (finalScore >= 5) {
            resultEmoji.textContent = '⭐';
            resultTitle.textContent = 'Bom Progresso!';
            resultSubtitle.textContent = 'Continue praticando para alcançar a nota máxima.';
        } else {
            resultEmoji.textContent = '💪';
            resultTitle.textContent = 'Não Desista!';
            resultSubtitle.textContent = 'Estude as tabuadas e tente o desafio novamente.';
        }

        // Save result in localStorage
        const newRecord = {
            id: Date.now(),
            date: new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            score: finalScore,
            correct: state.quiz.correctCount,
            wrong: state.quiz.wrongCount,
            difficulty: state.quiz.difficulty || 'facil'
        };

        state.history.unshift(newRecord); // Prepend to history
        localStorage.setItem('tabuada_master_history', JSON.stringify(state.history));

        // UI transition
        quizActiveScreen.classList.remove('active');
        quizResultScreen.classList.add('active');
    }


    // === STATS & HISTORY RENDER ===
    function renderHistoryAndStats() {
        const total = state.history.length;
        
        if (total === 0) {
            statsAvgScore.textContent = '0.0';
            statsTotalTests.textContent = '0';
            statsSuccessRate.textContent = '0%';
            
            historyEmpty.classList.remove('hidden');
            historyItems.classList.add('hidden');
            return;
        }

        // Compute metrics
        let totalScore = 0;
        let totalCorrect = 0;
        let totalQuestions = total * 10;

        state.history.forEach(item => {
            totalScore += item.score;
            totalCorrect += item.correct;
        });

        const avgScore = totalScore / total;
        const successRate = Math.round((totalCorrect / totalQuestions) * 100);

        // Populate Dashboard cards
        statsAvgScore.textContent = avgScore.toFixed(1);
        statsTotalTests.textContent = total;
        statsSuccessRate.textContent = `${successRate}%`;

        // Render List items
        historyEmpty.classList.add('hidden');
        historyItems.classList.remove('hidden');
        historyItems.innerHTML = '';

        state.history.forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-row';
            
            // Score badge color logic
            let badgeClass = 'score-badge-low';
            if (item.score >= 8) {
                badgeClass = 'score-badge-high';
            } else if (item.score >= 5) {
                badgeClass = 'score-badge-mid';
            }

            const diffLabels = {
                facil: '<span class="diff-tag tag-facil">Fácil</span>',
                medio: '<span class="diff-tag tag-medio">Médio</span>',
                dificil: '<span class="diff-tag tag-dificil">Difícil</span>'
            };
            const diffLabel = diffLabels[item.difficulty || 'facil'] || '';

            row.innerHTML = `
                <div class="history-row-details">
                    <span class="history-date">${item.date} ${diffLabel}</span>
                    <span class="history-stats-sub">${item.correct} acertos, ${item.wrong} erros</span>
                </div>
                <div class="history-score-badge ${badgeClass}">
                    ${item.score.toFixed(0)}
                </div>
            `;
            historyItems.appendChild(row);
        });
    }

    // Clear History mechanism
    btnClearHistory.addEventListener('click', () => {
        if (state.history.length === 0) return;

        const confirmClear = confirm('Tem certeza que deseja apagar todo o histórico de notas?');
        if (confirmClear) {
            state.history = [];
            localStorage.removeItem('tabuada_master_history');
            renderHistoryAndStats();
        }
    });


    // === INITIALIZATION ===
    initStudyTab();
});

// Register Service Worker for PWA (Offline Support & Installation)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
