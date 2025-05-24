// components/admin/CardManager.jsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSave,
    FaTimes,
    FaUpload,
    FaVolumeUp,
    FaSearch
} from 'react-icons/fa';
import { speakText } from '@/lib/speech';

const CardManager = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cardSets, setCardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [cards, setCards] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Verificar autenticación
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Cargar conjuntos de tarjetas
    useEffect(() => {
        if (session?.user?.id) {
            const fetchCardSets = async () => {
                try {
                    const response = await fetch('/api/card-sets');
                    if (response.ok) {
                        const data = await response.json();
                        setCardSets(data);

                        // Seleccionar el primer conjunto por defecto
                        if (data.length > 0 && !selectedSet) {
                            setSelectedSet(data[0]);
                            fetchCards(data[0].id);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching card sets:', error);
                }
            };

            fetchCardSets();
        }
    }, [session]);

    // Cargar tarjetas del conjunto seleccionado
    const fetchCards = async (cardSetId) => {
        try {
            const response = await fetch(`/api/cards?cardSetId=${cardSetId}`);
            if (response.ok) {
                const data = await response.json();
                setCards(data);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    };

    // Filtrar tarjetas por término de búsqueda
    const filteredCards = cards.filter(card =>
        card.spanishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.englishWord.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Crear nuevo conjunto de tarjetas
    const handleCreateCardSet = async () => {
        const name = prompt('Nombre del conjunto de tarjetas:');
        if (!name) return;

        const description = prompt('Descripción (opcional):');
        const level = prompt('Nivel (1-5):', '1');

        try {
            const response = await fetch('/api/card-sets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    level: parseInt(level) || 1,
                }),
            });

            if (response.ok) {
                const newCardSet = await response.json();
                setCardSets([...cardSets, newCardSet]);
                setSelectedSet(newCardSet);
                setCards([]);
            }
        } catch (error) {
            console.error('Error creating card set:', error);
        }
    };

    // Eliminar conjunto de tarjetas
    const handleDeleteCardSet = async () => {
        if (!selectedSet) return;

        if (!confirm(`¿Estás seguro de que deseas eliminar "${selectedSet.name}"? Esta acción no se puede deshacer y eliminará todas las tarjetas asociadas.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/card-sets/${selectedSet.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const updatedCardSets = cardSets.filter(set => set.id !== selectedSet.id);
                setCardSets(updatedCardSets);

                if (updatedCardSets.length > 0) {
                    setSelectedSet(updatedCardSets[0]);
                    fetchCards(updatedCardSets[0].id);
                } else {
                    setSelectedSet(null);
                    setCards([]);
                }
            }
        } catch (error) {
            console.error('Error deleting card set:', error);
        }
    };

    // Iniciar edición de tarjeta
    const handleEditCard = (card) => {
        setEditingCard({
            id: card.id,
            imageUrl: card.imageUrl,
            spanishWord: card.spanishWord,
            englishWord: card.englishWord,
            difficulty: card.difficulty,
        });
        setIsEditingCard(true);
    };

    // Crear nueva tarjeta
    const handleNewCard = () => {
        setEditingCard({
            imageUrl: '',
            spanishWord: '',
            englishWord: '',
            difficulty: 1,
        });
        setIsEditingCard(true);
    };

    // Guardar tarjeta (nueva o editada)
    const handleSaveCard = async () => {
        if (!editingCard || !selectedSet) return;

        // Validar datos
        if (!editingCard.imageUrl || !editingCard.spanishWord || !editingCard.englishWord) {
            alert('Por favor, completa todos los campos requeridos');
            return;
        }

        try {
            const isNew = !editingCard.id;
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew
                ? '/api/cards'
                : `/api/cards/${editingCard.id}`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...editingCard,
                    cardSetId: selectedSet.id,
                }),
            });

            if (response.ok) {
                const savedCard = await response.json();

                if (isNew) {
                    setCards([...cards, savedCard]);
                } else {
                    setCards(cards.map(card =>
                        card.id === savedCard.id ? savedCard : card
                    ));
                }

                setIsEditingCard(false);
                setEditingCard(null);
            }
        } catch (error) {
            console.error('Error saving card:', error);
        }
    };

    // Eliminar tarjeta
    const handleDeleteCard = async (cardId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCards(cards.filter(card => card.id !== cardId));
            }
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    };

    // Subir imagen
    const handleUploadImage = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingImage(true);

        try {
            // Crear un FormData
            const formData = new FormData();
            formData.append('file', file);

            // Subir la imagen a tu servicio de almacenamiento
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const { url } = await response.json();
                setEditingCard({ ...editingCard, imageUrl: url });
            } else {
                alert('Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Pronunciar palabra
    const handleSpeak = (word, language) => {
        speakText(word, language === 'spanish' ? 'es-ES' : 'en-US');
    };

    if (status === 'loading') {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    return (
        <div className="p-4 md:p-6">
            {/* Selección de conjunto de tarjetas */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-700">Conjuntos de Tarjetas</h2>
                    <button
                        onClick={handleCreateCardSet}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    >
                        <FaPlus className="mr-1" /> Nuevo Conjunto
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {cardSets.length === 0 ? (
                        <p className="text-gray-500">No hay conjuntos de tarjetas. Crea uno nuevo para comenzar.</p>
                    ) : (
                        cardSets.map((set) => (
                            <button
                                key={set.id}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${
                                    selectedSet?.id === set.id
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => {
                                    setSelectedSet(set);
                                    fetchCards(set.id);
                                }}
                            >
                                {set.name} <span className="text-xs">(Nivel {set.level})</span>
                            </button>
                        ))
                    )}
                </div>

                {selectedSet && (
                    <div className="mt-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">{selectedSet.description}</p>
                            <p className="text-xs text-gray-500">
                                {cards.length} tarjetas en este conjunto
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteCardSet}
                            className="text-red-500 hover:text-red-700 text-sm"
                        >
                            Eliminar conjunto
                        </button>
                    </div>
                )}
            </div>

            {/* Lista de tarjetas */}
            {selectedSet && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-700">
                            Tarjetas en {selectedSet.name}
                        </h2>
                        <div className="flex space-x-2">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar tarjetas..."
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleNewCard}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                            >
                                <FaPlus className="mr-1" /> Nueva Tarjeta
                            </button>
                        </div>
                    </div>

                    {/* Formulario de edición */}
                    {isEditingCard && (
                        <div className="mb-6 p-4 border border-indigo-100 rounded-lg bg-indigo-50">
                            <h3 className="text-md font-bold text-indigo-800 mb-3">
                                {editingCard.id ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Columna izquierda - Imagen */}
                                <div className="space-y-3">
                                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden aspect-video relative">
                                        {editingCard.imageUrl ? (
                                            <Image
                                                src={editingCard.imageUrl}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-400">Sin imagen</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleUploadImage}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            disabled={isUploadingImage}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                                        >
                                            <FaUpload className="mr-1" />
                                            {isUploadingImage ? 'Subiendo...' : 'Subir imagen'}
                                        </button>
                                        {editingCard.imageUrl && (
                                            <button
                                                onClick={() => setEditingCard({ ...editingCard, imageUrl: '' })}
                                                className="ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            URL de imagen (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={editingCard.imageUrl}
                                            onChange={(e) => setEditingCard({ ...editingCard, imageUrl: e.target.value })}
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Columna derecha - Datos */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Palabra en Español *
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={editingCard.spanishWord}
                                                onChange={(e) => setEditingCard({ ...editingCard, spanishWord: e.target.value })}
                                                placeholder="Ejemplo: Perro"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                                                required
                                            />
                                            <button
                                                onClick={() => handleSpeak(editingCard.spanishWord, 'spanish')}
                                                className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md"
                                            >
                                                <FaVolumeUp className="text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Palabra en Inglés *
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={editingCard.englishWord}
                                                onChange={(e) => setEditingCard({ ...editingCard, englishWord: e.target.value })}
                                                placeholder="Ejemplo: Dog"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                                                required
                                            />
                                            <button
                                                onClick={() => handleSpeak(editingCard.englishWord, 'english')}
                                                className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md"
                                            >
                                                <FaVolumeUp className="text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dificultad
                                        </label>
                                        <select
                                            value={editingCard.difficulty}
                                            onChange={(e) => setEditingCard({ ...editingCard, difficulty: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="1">Muy fácil</option>
                                            <option value="2">Fácil</option>
                                            <option value="3">Media</option>
                                            <option value="4">Difícil</option>
                                            <option value="5">Muy difícil</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 flex justify-end space-x-2">
                                        <button
                                            onClick={() => {
                                                setIsEditingCard(false);
                                                setEditingCard(null);
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                                        >
                                            <FaTimes className="mr-1" /> Cancelar
                                        </button>

                                        <button
                                            onClick={handleSaveCard}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                                        >
                                            <FaSave className="mr-1" /> Guardar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista de tarjetas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCards.length === 0 ? (
                            <p className="col-span-full text-gray-500 text-center py-10">
                                {searchTerm
                                    ? 'No se encontraron tarjetas que coincidan con la búsqueda.'
                                    : 'No hay tarjetas en este conjunto. Crea una nueva para comenzar.'}
                            </p>
                        ) : (
                            filteredCards.map((card) => (
                                <motion.div
                                    key={card.id}
                                    layoutId={card.id}
                                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                                >
                                    <div className="relative aspect-video bg-gray-100">
                                        {card.imageUrl ? (
                                            <Image
                                                src={card.imageUrl}
                                                alt={card.spanishWord}
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-400">Sin imagen</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold">{card.spanishWord}</h3>
                                            <button
                                                onClick={() => handleSpeak(card.spanishWord, 'spanish')}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaVolumeUp />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-indigo-600">{card.englishWord}</h3>
                                            <button
                                                onClick={() => handleSpeak(card.englishWord, 'english')}
                                                className="text-indigo-500 hover:text-indigo-700"
                                            >
                                                <FaVolumeUp />
                                            </button>
                                        </div>

                                        <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Dificultad: {card.difficulty}
                      </span>

                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditCard(card)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardManager;