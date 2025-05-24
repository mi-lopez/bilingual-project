// lib/speech/index.js

/**
 * Utilidades para trabajar con la Web Speech API
 * Este módulo proporciona funciones para text-to-speech y speech-to-text
 */

// Verifica si las APIs están disponibles en el navegador
const isBrowser = typeof window !== 'undefined';
const speechSynthesisAvailable = isBrowser && 'speechSynthesis' in window;
const speechRecognitionAvailable = isBrowser && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/**
 * Función para convertir texto a voz
 * @param {string} text - El texto a pronunciar
 * @param {string} language - Código de idioma (e.g., 'es-ES', 'en-US')
 * @param {function} onStart - Callback cuando inicia la pronunciación
 * @param {function} onEnd - Callback cuando termina la pronunciación
 * @returns {boolean} - True si se pudo iniciar, false si no está disponible
 */
export const speakText = (text, language = 'en-US', onStart = null, onEnd = null) => {
    if (!speechSynthesisAvailable) {
        console.warn('Speech synthesis no está disponible en este navegador');
        return false;
    }

    // Cancelar cualquier pronunciación en curso
    window.speechSynthesis.cancel();

    // Crear nuevo utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    // Configurar velocidad y tono - útil para voces de niños
    if (language === 'en-US') {
        // Para inglés, una voz un poco más lenta y clara
        utterance.rate = 0.9; // Velocidad (0.1 a 10)
        utterance.pitch = 1.1; // Tono (0 a 2)
    } else if (language === 'es-ES') {
        // Para español
        utterance.rate = 0.9;
        utterance.pitch = 1;
    }

    // Tratar de encontrar una voz apropiada
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Buscar la mejor voz para el idioma
        const preferredVoice = voices.find(voice =>
            voice.lang.startsWith(language.split('-')[0]) &&
            !voice.name.includes('Google') // Evitar voces de Google que a veces suenan robóticas
        );

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
    }

    // Configurar callbacks
    if (onStart) {
        utterance.onstart = onStart;
    }

    if (onEnd) {
        utterance.onend = onEnd;
    }

    // Pronunciar el texto
    window.speechSynthesis.speak(utterance);
    return true;
};

/**
 * Clase para manejar el reconocimiento de voz
 */
export class SpeechRecognizer {
    constructor(language = 'en-US', continuous = false) {
        if (!speechRecognitionAvailable) {
            console.warn('Speech recognition no está disponible en este navegador');
            this.available = false;
            return;
        }

        this.available = true;
        this.language = language;
        this.continuous = continuous;
        this.isListening = false;
        this.onResultCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;

        // Inicializar el reconocimiento de voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = language;
        this.recognition.continuous = continuous;
        this.recognition.interimResults = false;

        // Configurar handlers
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
    }

    /**
     * Iniciar el reconocimiento de voz
     * @param {function} onResult - Callback cuando hay un resultado
     * @param {function} onEnd - Callback cuando termina el reconocimiento
     * @param {function} onError - Callback cuando hay un error
     */
    start(onResult, onEnd = null, onError = null) {
        if (!this.available) return false;

        if (this.isListening) {
            this.stop();
        }

        this.onResultCallback = onResult;
        this.onEndCallback = onEnd;
        this.onErrorCallback = onError;

        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            return false;
        }
    }

    /**
     * Detener el reconocimiento de voz
     */
    stop() {
        if (!this.available || !this.isListening) return;

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error al detener reconocimiento:', error);
        }
    }

    /**
     * Cambiar el idioma de reconocimiento
     * @param {string} language - Código de idioma (e.g., 'es-ES', 'en-US')
     */
    setLanguage(language) {
        this.language = language;
        if (this.available) {
            this.recognition.lang = language;
        }
    }

    /**
     * Manejar el evento de resultado
     * @param {SpeechRecognitionEvent} event - Evento con los resultados
     */
    handleResult(event) {
        if (!this.onResultCallback) return;

        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim();
        const confidence = event.results[last][0].confidence;

        console.log(`Reconocido: "${transcript}" (confianza: ${confidence.toFixed(2)})`);

        this.onResultCallback({
            transcript,
            confidence,
            isFinal: event.results[last].isFinal
        });
    }

    /**
     * Manejar el evento de fin de reconocimiento
     */
    handleEnd() {
        this.isListening = false;
        if (this.onEndCallback) {
            this.onEndCallback();
        }
    }

    /**
     * Manejar errores de reconocimiento
     * @param {SpeechRecognitionError} event - Evento de error
     */
    handleError(event) {
        this.isListening = false;
        console.error('Error de reconocimiento:', event.error);

        if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
        }
    }
}

/**
 * Comprobar si la pronunciación del estudiante es correcta
 * @param {string} said - Lo que dijo el estudiante
 * @param {string} expected - La palabra correcta esperada
 * @returns {boolean} - True si es correcto, false si no
 */
export const checkPronunciation = (said, expected) => {
    // Normalizar ambas cadenas para la comparación
    const normalizedSaid = said.toLowerCase().trim();
    const normalizedExpected = expected.toLowerCase().trim();

    // Comparación exacta
    if (normalizedSaid === normalizedExpected) {
        return true;
    }

    // Comparación flexible - útil para niños que están aprendiendo
    // Permite errores comunes como omisiones o adiciones menores

    // Método 1: Calcular la distancia de Levenshtein para permitir pequeños errores
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
                    matrix[i - 1][j] + 1,      // eliminación
                    matrix[i][j - 1] + 1,      // inserción
                    matrix[i - 1][j - 1] + cost // sustitución
                );
            }
        }

        return matrix[a.length][b.length];
    };

    // Calcular el umbral basado en la longitud de la palabra
    // Para palabras cortas, permitimos menos errores
    const threshold = Math.max(1, Math.floor(normalizedExpected.length / 4));

    const distance = levenshteinDistance(normalizedSaid, normalizedExpected);
    return distance <= threshold;
};

/**
 * Comprueba si las APIs de voz están disponibles
 * @returns {Object} - Estado de disponibilidad
 */
export const checkSpeechSupport = () => {
    return {
        speechSynthesis: speechSynthesisAvailable,
        speechRecognition: speechRecognitionAvailable,
        fullSupport: speechSynthesisAvailable && speechRecognitionAvailable
    };
};

/**
 * Obtener voces disponibles por idioma
 * @param {string} language - Código de idioma ('es' o 'en')
 * @returns {Array} - Array de voces disponibles
 */
export const getVoicesByLanguage = (language) => {
    if (!speechSynthesisAvailable) return [];

    return window.speechSynthesis.getVoices().filter(voice =>
        voice.lang.startsWith(language)
    );
};

/**
 * Configurar la mejor voz para un idioma específico
 * @param {string} language - Código de idioma completo ('es-ES', 'en-US')
 * @returns {SpeechSynthesisVoice|null} - La mejor voz encontrada o null
 */
export const getBestVoice = (language) => {
    if (!speechSynthesisAvailable) return null;

    const voices = window.speechSynthesis.getVoices();

    // Prioridad: voz nativa > voz local > cualquier voz del idioma
    const nativeVoice = voices.find(voice =>
        voice.lang === language && voice.localService
    );

    if (nativeVoice) return nativeVoice;

    const localVoice = voices.find(voice =>
        voice.lang.startsWith(language.split('-')[0]) && voice.localService
    );

    if (localVoice) return localVoice;

    // Cualquier voz del idioma
    return voices.find(voice =>
        voice.lang.startsWith(language.split('-')[0])
    ) || null;
};