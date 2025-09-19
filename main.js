document.addEventListener('DOMContentLoaded', () => {
    // --- 収入シミュレーション ---
    const slider = document.getElementById('delivery-slider');
    const deliveryCountEl = document.getElementById('delivery-count');
    const perPieceIncomeEl = document.getElementById('per-piece-income');
    const dailyGuaranteeIncomeEl = document.getElementById('daily-guarantee-income');
    
    const deliverySteps = [80, 120, 180];
    const FIXED_DAILY_GUARANTEE = 520000; // 日給保証を52万円に固定
    const PER_PIECE_PRICE = 180;
    const WORKING_DAYS = 26;

    const formatCurrency = (value) => new Intl.NumberFormat('ja-JP').format(value);

    const calculateIncome = (sliderIndex) => {
        const deliveries = deliverySteps[sliderIndex];
        const perPieceTotal = deliveries * PER_PIECE_PRICE * WORKING_DAYS;
        const dailyGuaranteeTotal = FIXED_DAILY_GUARANTEE; // 固定値を参照
        
        deliveryCountEl.textContent = deliveries;
        perPieceIncomeEl.textContent = formatCurrency(perPieceTotal);
        dailyGuaranteeIncomeEl.textContent = formatCurrency(dailyGuaranteeTotal);
        return { perPieceTotal, dailyGuaranteeTotal };
    };

    const updateSliderStyle = (target) => {
        const min = target.min;
        const max = target.max;
        const val = target.value;
        const percentage = (val - min) * 100 / (max - min);
        target.style.background = `linear-gradient(to right, #14f195 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%)`;
    };

    if (slider && document.getElementById('incomeChart')) {
        Chart.defaults.font.family = "'Noto Sans JP', sans-serif";
        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
        const ctx = document.getElementById('incomeChart').getContext('2d');
        const incomeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['あなたの月収(個単価)', '日給保証'],
                datasets: [{
                    label: '月間売上',
                    data: [0, 0],
                    backgroundColor: ['rgba(56, 189, 248, 0.6)', 'rgba(168, 85, 247, 0.6)'],
                    borderColor: ['#38bdf8', '#a855f7'],
                    borderWidth: 2,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: (value) => value / 10000 + '万円'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label || ''}: ${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y)}`
                        }
                    }
                }
            }
        });
        
        const updateChart = (perPieceTotal, dailyGuaranteeTotal) => {
            incomeChart.data.datasets[0].data[0] = perPieceTotal;
            incomeChart.data.datasets[0].data[1] = dailyGuaranteeTotal;
            incomeChart.update();
        };

        slider.addEventListener('input', (event) => {
            const sliderIndex = parseInt(event.target.value, 10);
            const { perPieceTotal, dailyGuaranteeTotal } = calculateIncome(sliderIndex);
            updateChart(perPieceTotal, dailyGuaranteeTotal);
            updateSliderStyle(event.target);
        });

        const initialSliderIndex = parseInt(slider.value, 10);
        const { perPieceTotal, dailyGuaranteeTotal } = calculateIncome(initialSliderIndex);
        updateChart(perPieceTotal, dailyGuaranteeTotal);
        updateSliderStyle(slider);
    }
    
    const askAiButton = document.getElementById('ask-ai-button');
    const aiQuestionEl = document.getElementById('ai-question');
    const aiAnswerBox = document.getElementById('ai-answer-box');

    if (askAiButton) {
        askAiButton.addEventListener('click', async () => {
            const userQuery = aiQuestionEl.value.trim();
            if (!userQuery) {
                aiAnswerBox.style.display = 'block';
                aiAnswerBox.textContent = '質問を入力してくださいね！';
                return;
            }
            aiAnswerBox.style.display = 'block';
            aiAnswerBox.innerHTML = '<div class="flex justify-center items-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div><p class="ml-3">AIが回答を考えています...</p></div>';
            askAiButton.disabled = true;
            
            const apiKey = "AIzaSyBTxtMHRDr51qd4eKuItmUpbSyXnEW_C64"; // APIキーをここに設定してください

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const systemPrompt = "あなたは株式会社DCの採用アシスタントAIです。軽貨物運送の仕事を探している人の友人として、最高の応援団長になってください！質問には、とても親しみやすく、やる気が出るように絵文字（✨🚚💪など）をたくさん使って、温かく答えてください。株式会社DCの強み（透明性のある報酬制度、風通しの良さ、独立支援など）を盛り込みながら、「君ならできる！」というポジティブな雰囲気で、200文字以内で元気に回答してください！";
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                   const errorData = await response.json();
                   console.error('API Error Response:', errorData);
                   throw new Error(`API error: ${response.statusText}`);
                }
                const result = await response.json();
                const candidate = result.candidates?.[0];
                if (candidate && candidate.content?.parts?.[0]?.text) {
                    aiAnswerBox.textContent = candidate.content.parts[0].text;
                } else {
                    let errorMessage = 'ごめんなさい！🤖 うまくお答えできませんでした。';
                    if (result.promptFeedback?.blockReason) {
                        errorMessage += `（理由: ${result.promptFeedback.blockReason}）`;
                    } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                        errorMessage += `（理由: ${candidate.finishReason}）`;
                    }
                    aiAnswerBox.textContent = errorMessage;
                }
            } catch (error) {
                console.error("Gemini API Error:", error);
                aiAnswerBox.textContent = '通信エラーが発生したみたいです😢 時間をおいてもう一度試してみてくださいね！APIキーが正しく設定されているかご確認ください。';
            } finally {
                askAiButton.disabled = false;
            }
        });
    }

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
    
    window.onscroll = () => {
        if (scrollTopBtn && (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300)) {
            scrollTopBtn.classList.remove('hidden', 'opacity-0', 'translate-y-4');
        } else if (scrollTopBtn) {
            scrollTopBtn.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => {
                if (document.body.scrollTop < 300 && document.documentElement.scrollTop < 300) {
                    scrollTopBtn.classList.add('hidden');
                }
            }, 300);
        }
    };
    if(scrollTopBtn) {
       scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
