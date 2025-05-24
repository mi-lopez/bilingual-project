'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FaMicrophone, FaVolumeUp, FaStar, FaHome } from 'react-icons/fa';
import Link from 'next/link';

const LearningGame = ({ cardSet, student, initialCards = [] }) => {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [cards, setCards] = useState(initialCards);
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [stars, setStars] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [progressLoaded, setProgressLoaded] = useState(false);

    const recognitionRef = useRef(null);
    const synth = useRef(null);
    const isProcessingRef = useRef(false);
    const timeoutRef = useRef(null);
    const hasProcessedResultRef = useRef(false);

    const currentCard = cards[Math.min(currentCardIndex, cards.length - 1)] || {};

    console.log('🐛 DEBUG INFO:', {
        currentCardIndex,
        cardsLength: cards.length,
        gameCompleted,
        progressLoaded,
        currentCard: currentCard,
        currentCardWord: currentCard?.englishWord,
        currentCardId: currentCard?.id,
        isProcessingVoice,
        isProcessingRef: isProcessingRef.current,
        hasProcessedResult: hasProcessedResultRef.current
    });

    // Limpiar timeouts al desmontar el componente
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (progressLoaded && cards.length > 0) {
            if (currentCardIndex >= cards.length) {
                console.log('🔧 Ajustando índice fuera de rango:', currentCardIndex, '->', cards.length - 1);
                setCurrentCardIndex(cards.length - 1);
                setGameCompleted(true);
            }
        }
    }, [progressLoaded, cards.length, currentCardIndex]);

    const calculateSimilarity = (word1, word2) => {
        if (!word1 || !word2) return 0;

        const levenshteinDistance = (a, b) => {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;

            const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill());

            for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
            for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

            for (let i = 1; i <= a.length; i++) {
                for (let j = 1; j <= b.length; j++) {
                    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + cost
                    );
                }
            }

            return matrix[a.length][b.length];
        };

        const distance = levenshteinDistance(word1, word2);
        const maxLength = Math.max(word1.length, word2.length);
        return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
    };

    const triggerConfetti = () => {
        try {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (error) {
            console.error('Error with confetti:', error);
        }
    };

    const saveProgressWithCard = async (success, card) => {
        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: student.id,
                    cardId: card.id,
                    success,
                }),
            });

            if (response.ok) {
                const updatedProgress = await response.json();
                console.log('✅ Progreso guardado:', updatedProgress);
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    };

    // FUNCIÓN NEXTCARD SIMPLIFICADA Y CONTROLADA
    const nextCard = useCallback(() => {
        console.log('🚀 nextCard llamado - Verificando condiciones');

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setFeedback(null);

        setCurrentCardIndex(prevIndex => {
            console.log(`🎯 nextCard: índice previo ${prevIndex}, total tarjetas ${cards.length}`);

            if (prevIndex < cards.length - 1) {
                const newIndex = prevIndex + 1;
                console.log(`➡️ Avanzando de tarjeta ${prevIndex + 1} a ${newIndex + 1}/${cards.length}`);
                return newIndex;
            } else {
                console.log('🎉 Ya estamos en la última tarjeta - completando juego');
                setGameCompleted(true);
                setFeedback({
                    correct: true,
                    message: '¡Felicidades! Has completado todas las tarjetas. ¡Excelente trabajo!'
                });
                if (isClient) {
                    triggerConfetti();
                }
                return prevIndex;
            }
        });

        setTimeout(() => {
            console.log('🔓 Reseteando banderas de procesamiento');
            isProcessingRef.current = false;
            setIsProcessingVoice(false);
            hasProcessedResultRef.current = false;
        }, 500);

    }, [cards.length, isClient]);

    // FUNCIÓN PARA MANEJAR RESPUESTA CORRECTA
    const handleCorrectAnswer = useCallback((card, matchReason) => {
        console.log(`✅ Respuesta correcta detectada (${matchReason})`);

        const encouragingMessages = [
            '¡Excelente! ¡Muy bien!',
            '¡Fantástico! ¡Lo lograste!',
            '¡Súper! ¡Eres increíble!',
            '¡Genial! ¡Sigue así!',
            '¡Perfecto! ¡Eres un campeón!',
            '¡Bravo! ¡Qué bien lo dijiste!',
            '¡Wow! ¡Eres muy inteligente!'
        ];

        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

        setFeedback({
            correct: true,
            message: randomMessage
        });

        setScore(prev => {
            const newScore = prev + 10;
            if (newScore % 50 === 0) {
                setStars(prevStars => prevStars + 1);
                if (isClient) {
                    triggerConfetti();
                }
            }
            return newScore;
        });

        saveProgressWithCard(true, card);

        console.log('⏰ Programando avance de tarjeta en 2 segundos...');

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            console.log('⏰ Timeout ejecutándose - avanzando tarjeta');
            nextCard();
        }, 2000);

    }, [isClient, nextCard]);

    // FUNCIÓN PARA MANEJAR RESPUESTA INCORRECTA
    const handleIncorrectAnswer = useCallback((transcript, expectedWord, card) => {
        console.log(`❌ Respuesta incorrecta: "${transcript}" vs "${expectedWord}"`);

        const gentleMessages = [
            `¡Casi! Intenta decir "${expectedWord}" otra vez 😊`,
            `¡Muy bien! Ahora di "${expectedWord}" 🌟`,
            `¡Sigue intentando! Di "${expectedWord}" 💪`,
            `¡Tú puedes! Intenta "${expectedWord}" de nuevo 🎯`
        ];

        const randomGentleMessage = gentleMessages[Math.floor(Math.random() * gentleMessages.length)];

        setFeedback({
            correct: false,
            message: randomGentleMessage
        });

        saveProgressWithCard(false, card);

        setTimeout(() => {
            console.log('🔓 Desbloqueando procesamiento de voz (respuesta incorrecta)');
            isProcessingRef.current = false;
            setIsProcessingVoice(false);
            hasProcessedResultRef.current = false;
        }, 1000);
    }, []);

    // HANDLESPEECHIRESULT REFACTORIZADO
    const handleSpeechResult = useCallback((event) => {
        console.log('🎤 handleSpeechResult iniciado');

        if (isProcessingRef.current || hasProcessedResultRef.current) {
            console.log('🚫 Ya procesando o ya procesado - IGNORANDO completamente');
            return;
        }

        isProcessingRef.current = true;
        hasProcessedResultRef.current = true;
        setIsProcessingVoice(true);
        console.log('🔒 Procesamiento de voz BLOQUEADO');

        const cardToEvaluate = cards[currentCardIndex] || {};

        if (!cardToEvaluate.id) {
            console.error('❌ No hay tarjeta válida para evaluar');
            isProcessingRef.current = false;
            hasProcessedResultRef.current = false;
            setIsProcessingVoice(false);
            return;
        }

        console.log('🎯 Evaluando tarjeta:', {
            index: currentCardIndex,
            word: cardToEvaluate.englishWord,
            id: cardToEvaluate.id
        });

        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();

        const spokenWord = transcript.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const expectedWord = cardToEvaluate.englishWord?.toLowerCase().replace(/[^\w\s]/g, '').trim();

        console.log('🎤 Análisis:', {
            transcrito: transcript,
            hablado: spokenWord,
            esperado: expectedWord
        });

        let isCorrect = false;
        let matchReason = '';

        if (spokenWord === expectedWord) {
            isCorrect = true;
            matchReason = 'exacto';
        }
        else if (expectedWord && spokenWord && expectedWord.includes(spokenWord)) {
            isCorrect = true;
            matchReason = 'contiene';
        }
        else if (expectedWord && spokenWord && spokenWord.includes(expectedWord)) {
            isCorrect = true;
            matchReason = 'incluye';
        }
        else if (expectedWord && spokenWord.length > 0) {
            const similarity = calculateSimilarity(spokenWord, expectedWord);
            console.log('📊 Similitud:', similarity);
            if (similarity >= 0.6) {
                isCorrect = true;
                matchReason = 'similar';
            }
        }
        else if (expectedWord && spokenWord) {
            const soundMapping = {
                'cat': ['kat', 'cot', 'cut', 'cats', 'kitty'],
                'dog': ['dug', 'dok', 'dogs', 'doggy', 'puppy'],
                'bird': ['burd', 'berd', 'bird', 'birdy'],
                'house': ['hous', 'haus', 'home'],
                'apple': ['apel', 'aple', 'appel', 'apul'],
                'red': ['rad', 'reed', 'reds']
            };

            const acceptedVariations = soundMapping[expectedWord] || [];
            if (acceptedVariations.some(variation =>
                spokenWord.includes(variation) || variation.includes(spokenWord)
            )) {
                isCorrect = true;
                matchReason = 'variación';
            }
        }
        else if (expectedWord && spokenWord) {
            const firstLetterMatch = expectedWord[0] === spokenWord[0];
            const lengthSimilar = Math.abs(expectedWord.length - spokenWord.length) <= 2;

            if (firstLetterMatch && lengthSimilar && spokenWord.length >= 2) {
                isCorrect = true;
                matchReason = 'sonido similar';
            }
        }

        if (isCorrect) {
            handleCorrectAnswer(cardToEvaluate, matchReason);
        } else {
            handleIncorrectAnswer(transcript, expectedWord, cardToEvaluate);
        }

    }, [cards, currentCardIndex, handleCorrectAnswer, handleIncorrectAnswer]);

    // FUNCIÓN MEJORADA PARA PRONUNCIAR PALABRAS
    const speakWord = (word, language) => {
        if (!isClient || !synth.current) return;

        try {
            // Cancelar cualquier pronunciación en curso
            synth.current.cancel();

            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = language === 'spanish' ? 'es-ES' : 'en-US';

            // Configuraciones mejoradas para voces más naturales
            if (language === 'spanish') {
                utterance.rate = 0.85; // Más lento para mayor claridad
                utterance.pitch = 1.0;  // Tono neutral
                utterance.volume = 0.9; // Volumen ligeramente reducido
            } else {
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                utterance.volume = 0.9;
            }

            // Intentar seleccionar la mejor voz disponible
            const voices = synth.current.getVoices();

            if (voices.length > 0) {
                let selectedVoice = null;

                if (language === 'spanish') {
                    // Prioridad para voces en español más naturales
                    const spanishVoices = voices.filter(voice =>
                        voice.lang.startsWith('es') && voice.localService
                    );

                    // Preferir voces locales nativas
                    selectedVoice = spanishVoices.find(voice =>
                        voice.name.includes('Elena') ||
                        voice.name.includes('Diego') ||
                        voice.name.includes('Mónica') ||
                        voice.name.includes('Jorge') ||
                        voice.lang === 'es-ES'
                    ) || spanishVoices[0];

                    // Si no hay voces locales, buscar cualquier voz en español (preferir femeninas)
                    if (!selectedVoice) {
                        selectedVoice = voices.find(voice =>
                            voice.lang.startsWith('es') &&
                            !voice.name.includes('Google') && // Evitar voces de Google que suenan más robóticas
                            (voice.name.includes('female') ||
                                voice.name.toLowerCase().includes('woman') ||
                                voice.name.includes('Carmen') ||
                                voice.name.includes('Paloma') ||
                                voice.name.includes('Esperanza'))
                        ) || voices.find(voice =>
                            voice.lang.startsWith('es') &&
                            !voice.name.includes('Google')
                        );
                    }
                } else {
                    // Para inglés, buscar voces nativas femeninas
                    const englishVoices = voices.filter(voice =>
                        voice.lang.startsWith('en') && voice.localService
                    );

                    selectedVoice = englishVoices.find(voice =>
                        voice.name.includes('Samantha') ||
                        voice.name.includes('Victoria') ||
                        voice.name.includes('Karen') ||
                        voice.name.includes('Susan') ||
                        voice.name.includes('Allison') ||
                        voice.name.includes('Ava') ||
                        voice.name.includes('Zoe') ||
                        (voice.name.toLowerCase().includes('female') && voice.lang === 'en-US')
                    ) || englishVoices.find(voice =>
                        !voice.name.toLowerCase().includes('male') &&
                        (voice.name.includes('female') ||
                            voice.voiceURI.includes('female') ||
                            // Muchas voces femeninas por defecto no especifican género
                            (!voice.name.includes('David') &&
                                !voice.name.includes('Daniel') &&
                                !voice.name.includes('Alex') &&
                                !voice.name.includes('Thomas')))
                    ) || englishVoices[0]; // Fallback a la primera voz disponible
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log(`Usando voz: ${selectedVoice.name} (${selectedVoice.lang})`);
                }
            }

            // Esperar un momento antes de pronunciar para evitar conflictos
            setTimeout(() => {
                synth.current.speak(utterance);
            }, 100);

        } catch (error) {
            console.error('Error speaking word:', error);
        }
    };

    // Función para inicializar y mostrar voces disponibles
    const initializeVoices = () => {
        if (!synth.current) return;

        let voices = synth.current.getVoices();

        if (voices.length === 0) {
            synth.current.onvoiceschanged = () => {
                voices = synth.current.getVoices();
                console.log('🎵 Voces femeninas disponibles:');
                console.log('Español:', voices.filter(v =>
                    v.lang.startsWith('es') &&
                    (v.name.includes('Elena') || v.name.includes('Carmen') ||
                        v.name.includes('Mónica') || v.name.includes('Paloma') ||
                        v.name.toLowerCase().includes('female'))
                ).map(v => `${v.name} (${v.lang})`));
                console.log('Inglés:', voices.filter(v =>
                    v.lang.startsWith('en') &&
                    (v.name.includes('Samantha') || v.name.includes('Victoria') ||
                        v.name.includes('Karen') || v.name.includes('Susan') ||
                        v.name.toLowerCase().includes('female'))
                ).map(v => `${v.name} (${v.lang})`));
            };
        } else {
            console.log('🎵 Voces femeninas disponibles:');
            console.log('Español:', voices.filter(v =>
                v.lang.startsWith('es') &&
                (v.name.includes('Elena') || v.name.includes('Carmen') ||
                    v.name.includes('Mónica') || v.name.includes('Paloma') ||
                    v.name.toLowerCase().includes('female'))
            ).map(v => `${v.name} (${v.lang})`));
            console.log('Inglés:', voices.filter(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Samantha') || v.name.includes('Victoria') ||
                    v.name.includes('Karen') || v.name.includes('Susan') ||
                    v.name.toLowerCase().includes('female'))
            ).map(v => `${v.name} (${v.lang})`));
        }
    };

    const startListening = () => {
        if (!isClient || !recognitionRef.current || gameCompleted) {
            if (gameCompleted) return;
            setFeedback({
                correct: false,
                message: 'Tu navegador no soporta reconocimiento de voz.'
            });
            return;
        }

        if (isProcessingRef.current || hasProcessedResultRef.current) {
            console.log('🚫 No se puede iniciar reconocimiento - ya procesando una respuesta');
            setFeedback({
                correct: false,
                message: 'Espera un momento, estoy procesando tu respuesta anterior...'
            });
            return;
        }

        try {
            hasProcessedResultRef.current = false;
            recognitionRef.current.start();
            setIsListening(true);
            setFeedback(null);
            console.log('🎤 Reconocimiento de voz iniciado');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setFeedback({
                correct: false,
                message: 'Error al iniciar el micrófono. Verifica los permisos.'
            });
        }
    };

    const loadStudentProgress = async () => {
        try {
            const response = await fetch(`/api/progress?studentId=${student.id}&cardSetId=${cardSet.id}`);
            if (response.ok) {
                const progressData = await response.json();

                let nextCardIndex = 0;
                let totalScore = 0;
                let masteredCount = 0;

                if (progressData.progress && Array.isArray(progressData.progress)) {
                    const validProgress = progressData.progress.filter(p =>
                        cards.some(card => card.id === p.cardId)
                    );

                    console.log('🔍 Progreso filtrado:', {
                        totalProgress: progressData.progress.length,
                        validProgress: validProgress.length,
                        cardsInSet: cards.length
                    });

                    totalScore = validProgress.reduce((sum, p) => sum + (p.successCount * 10), 0);

                    for (let i = 0; i < cards.length; i++) {
                        const cardProgress = validProgress.find(p => p.cardId === cards[i].id);

                        if (cardProgress && cardProgress.mastered) {
                            masteredCount++;
                        } else if (!cardProgress || !cardProgress.mastered) {
                            nextCardIndex = i;
                            break;
                        }
                    }

                    if (masteredCount === cards.length) {
                        nextCardIndex = Math.max(0, cards.length - 1);
                        setGameCompleted(true);
                        console.log(`🎉 Todas las ${cards.length} tarjetas están dominadas - juego completado`);
                    }

                    console.log(`📚 Progreso cargado:`, {
                        empezando: `${nextCardIndex + 1}/${cards.length}`,
                        puntos: totalScore,
                        dominadas: `${masteredCount}/${cards.length}`
                    });
                }

                const safeIndex = Math.max(0, Math.min(nextCardIndex, cards.length - 1));
                setCurrentCardIndex(safeIndex);
                setScore(totalScore);
                setStars(Math.floor(totalScore / 50));
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        } finally {
            setProgressLoaded(true);
        }
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (cardSet.id && cards.length > 0) {
            console.log('🔄 Nuevo conjunto de tarjetas detectado, reseteando estado');
            setCurrentCardIndex(0);
            setGameCompleted(false);
            setProgressLoaded(false);
            setFeedback(null);
            setScore(0);
            setStars(0);
            setIsProcessingVoice(false);
            isProcessingRef.current = false;
            hasProcessedResultRef.current = false;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [cardSet.id]);

    useEffect(() => {
        if (!isClient || cards.length === 0) return;

        if (!progressLoaded) {
            console.log('🔄 Cargando progreso para nuevo conjunto:', {
                cardSetId: cardSet.id,
                cardsCount: cards.length
            });
            loadStudentProgress();
        }
    }, [isClient, cards.length, cardSet.id]);

    useEffect(() => {
        if (!isClient) return;

        let mounted = true;

        if (window.speechSynthesis) {
            synth.current = window.speechSynthesis;
            initializeVoices(); // Inicializar voces
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                if (!mounted) return;
                handleSpeechResult(event);
            };

            recognitionRef.current.onerror = (event) => {
                if (!mounted) return;
                console.error('Speech recognition error', event.error);
                setIsListening(false);

                setTimeout(() => {
                    console.log('🔓 Desbloqueando por error de reconocimiento');
                    isProcessingRef.current = false;
                    hasProcessedResultRef.current = false;
                    setIsProcessingVoice(false);
                }, 500);

                setFeedback({
                    correct: false,
                    message: 'No pude escucharte bien. Intenta de nuevo.'
                });
            };

            recognitionRef.current.onend = () => {
                if (!mounted) return;
                console.log('🎤 Reconocimiento terminado');
                setIsListening(false);
            };
        }

        return () => {
            mounted = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignorar errores de cleanup
                }
            }
            if (synth.current) {
                try {
                    synth.current.cancel();
                } catch (e) {
                    // Ignorar errores de cleanup
                }
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isClient, handleSpeechResult]);

    // Condiciones de renderizado
    if (!isClient || !progressLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-100">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <p className="text-gray-600">
                        {!isClient ? 'Cargando juego...' : 'Cargando tu progreso...'}
                    </p>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">No hay tarjetas disponibles</h2>
                    <p className="text-gray-600 mb-4">Este conjunto no tiene tarjetas para practicar.</p>
                    <Link href="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!currentCard.id && cards.length > 0) {
        console.error('❌ CurrentCard undefined pero hay tarjetas disponibles');
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Error de datos</h2>
                    <p className="text-gray-600 mb-4">
                        Hubo un problema cargando la tarjeta actual.
                        <br />Índice: {currentCardIndex}, Total: {cards.length}
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                setCurrentCardIndex(0);
                                setGameCompleted(false);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 mr-2"
                        >
                            Reiniciar desde el principio
                        </button>
                        <Link href="/dashboard" className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                            Volver al Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 p-4">
            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-6">
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
                    <FaHome className="h-6 w-6" />
                </Link>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-indigo-800">{cardSet.name}</h1>
                    <p className="text-sm text-gray-600">
                        {gameCompleted ? (
                            '¡Juego Completado! 🎉'
                        ) : (
                            `Tarjeta ${Math.min(currentCardIndex + 1, cards.length)} de ${cards.length}`
                        )}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-indigo-700">
                        {score} pts
                    </div>
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                                key={i}
                                className={`h-4 w-4 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Tarjeta principal */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCardIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
                >
                    {/* Imagen */}
                    <div className="mb-6 rounded-lg overflow-hidden border-4 border-indigo-200">
                        <div className="relative h-48 w-full">
                            <Image
                                src={currentCard.imageUrl || '/images/placeholder.jpg'}
                                alt={currentCard.spanishWord}
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* Palabras */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-800">{currentCard.spanishWord}</span>
                            <button
                                onClick={() => speakWord(currentCard.spanishWord, 'spanish')}
                                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            >
                                <FaVolumeUp className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-indigo-600">{currentCard.englishWord}</span>
                            <button
                                onClick={() => speakWord(currentCard.englishWord, 'english')}
                                className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
                            >
                                <FaVolumeUp className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mt-4 p-3 rounded-lg ${
                                    feedback.correct
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {feedback.message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>

            {/* Botón de micrófono - CENTRADO Y MEJORADO */}
            <div className="mt-8 flex flex-col items-center justify-center w-full">
                <div className="relative">
                    {/* Anillo de pulso cuando está escuchando */}
                    {isListening && (
                        <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-20"></div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={startListening}
                        disabled={isListening || gameCompleted || isProcessingVoice}
                        className={`p-6 rounded-full transition-all duration-300 shadow-2xl relative z-10 ${
                            isListening
                                ? 'bg-red-500 animate-pulse shadow-red-300'
                                : gameCompleted
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : isProcessingVoice
                                        ? 'bg-yellow-500 cursor-not-allowed animate-bounce shadow-yellow-300'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300 hover:shadow-indigo-400 hover:-translate-y-1'
                        } text-white`}
                    >
                        <FaMicrophone className="h-8 w-8" />

                        {/* Indicador de grabación */}
                        {isListening && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                    </motion.button>
                </div>

                <div className="mt-4 text-center max-w-sm px-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {isListening
                            ? (
                                <>
                                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                                    <strong>Escuchando...</strong>
                                    <br />
                                    Di "<span className="font-semibold text-indigo-600">{currentCard.englishWord}</span>" en inglés
                                </>
                            )
                            : isProcessingVoice
                                ? (
                                    <>
                                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-bounce mr-2"></span>
                                        <strong>Procesando tu respuesta...</strong>
                                    </>
                                )
                                : gameCompleted
                                    ? '🎉 ¡Juego completado!'
                                    : (
                                        <>
                                            Presiona el micrófono y di
                                            <br />
                                            "<span className="font-semibold text-indigo-600">{currentCard.englishWord}</span>" en inglés
                                        </>
                                    )}
                    </p>
                </div>
            </div>

            {/* Botones */}
            {!gameCompleted && currentCardIndex < cards.length - 1 && (
                <button
                    onClick={nextCard}
                    className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                    Saltar tarjeta ({currentCardIndex + 1}/{cards.length})
                </button>
            )}

            {gameCompleted && (
                <Link
                    href="/dashboard"
                    className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                    Volver al Dashboard
                </Link>
            )}

            <style jsx>{`
                @keyframes pulse-ring {
                    0% {
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default LearningGame;