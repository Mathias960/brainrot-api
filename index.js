// API Gratuite pour Finder - Steal a Brainrot
// Déployé sur Vercel (gratuit, sans carte bancaire)

// Stockage en mémoire (simple et gratuit)
// Note: Les données sont perdues au redémarrage, mais c'est gratuit!
// Pour persister, vous pouvez utiliser MongoDB Atlas (gratuit) ou Supabase (gratuit)

let brainrotData = [];

// Fonction pour nettoyer les données anciennes (plus de 1 heure)
function cleanOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    brainrotData = brainrotData.filter(item => item.timestamp > oneHourAgo);
}

// Fonction pour formater les valeurs
function formatValue(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
}

module.exports = async (req, res) => {
    // CORS headers pour permettre les requêtes depuis Roblox
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Nettoyer les données anciennes
        cleanOldData();

        // Route: GET /api - Récupérer toutes les données
        if (req.method === 'GET') {
            // Trier par valeur décroissante
            const sorted = [...brainrotData].sort((a, b) => b.value - a.value);
            
            // Limiter à 100 résultats
            const limited = sorted.slice(0, 100);

            return res.status(200).json({
                success: true,
                count: limited.length,
                total: brainrotData.length,
                data: limited,
                message: 'Données récupérées avec succès'
            });
        }

        // Route: POST /api - Ajouter des données
        if (req.method === 'POST') {
            const newData = req.body;

            // Vérifier que les données sont valides
            if (!newData || !Array.isArray(newData) || newData.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Données invalides. Attendu: tableau de brainrots'
                });
            }

            let added = 0;
            let updated = 0;

            // Traiter chaque brainrot
            for (const brainrot of newData) {
                if (!brainrot.name || !brainrot.value) {
                    continue; // Ignorer les données invalides
                }

                // Créer un ID unique
                const id = `${brainrot.name}_${brainrot.serverId || 'unknown'}_${brainrot.position?.X || 0}_${brainrot.position?.Y || 0}_${brainrot.position?.Z || 0}`;

                // Chercher si existe déjà
                const existingIndex = brainrotData.findIndex(item => item.id === id);

                if (existingIndex >= 0) {
                    // Mettre à jour si la valeur est plus élevée
                    if (brainrot.value > brainrotData[existingIndex].value) {
                        brainrotData[existingIndex] = {
                            ...brainrot,
                            id: id,
                            timestamp: Date.now()
                        };
                        updated++;
                    }
                } else {
                    // Ajouter nouveau
                    brainrotData.push({
                        ...brainrot,
                        id: id,
                        timestamp: Date.now()
                    });
                    added++;
                }
            }

            // Limiter à 500 brainrots maximum (pour éviter de surcharger la mémoire)
            if (brainrotData.length > 500) {
                // Garder les 500 meilleurs
                brainrotData.sort((a, b) => b.value - a.value);
                brainrotData = brainrotData.slice(0, 500);
            }

            return res.status(200).json({
                success: true,
                added: added,
                updated: updated,
                total: brainrotData.length,
                message: `${added} ajouté(s), ${updated} mis à jour`
            });
        }

        // Route non supportée
        return res.status(405).json({
            success: false,
            error: 'Méthode non supportée. Utilisez GET ou POST'
        });

    } catch (error) {
        console.error('Erreur API:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur serveur'
        });
    }
};

