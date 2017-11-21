const algoliasearch = require('algoliasearch');
const dotenv = require('dotenv');
const firebase = require('firebase');

/***
 * ***************************************
 * *************** iNeed *****************
 * ***************************************
 *
 * >>>>>>>>>>>>>>>config<<<<<<<<<<<<<<<<<<
 *
 * install dependencies:
 *
 * npm install dotenv --save
 * npm install algoliasearch --save
 * npm install firebase --save
 *
 * Configure your environment
 *
 * ALGOLIA_APP_ID=<algolia-app-id>
 * ALGOLIA_API_KEY=<algolia-api-key>
 * ALGOLIA_INDEX_NAME='contacts'
 * FIREBASE_DATABASE_URL=https://<my-firebase-database>.firebaseio.com
 *
 */

// carregue valores do arquivo .env neste diretório para process.env
dotenv.load();

// Configura o firebase
firebase.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const database = firebase.database();

/**
 * Configuração do Algolia
 */
const algolia = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY
);
const index = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);

/**
 * Monitora os eventos do firebase para a adicionar, remover e atualizar o produto.
 * Atualizado o índex do Algolia em correspondência ao banco real time do Firebase.
 * @type {firebase.database.Reference}
 */
const contactsRef = database.ref('/products');
contactsRef.on('child_added', addOrUpdateIndexRecord);
contactsRef.on('child_changed', addOrUpdateIndexRecord);
contactsRef.on('child_removed', deleteIndexRecord);

/**
 * Adiciona ou atualiza um determinado produto ouvido do firebase.
 * @param dataSnapshot
 */
function addOrUpdateIndexRecord(dataSnapshot) {
    // Obter Firebase
    const record = dataSnapshot.val();
    // Especifique o objeto do Algolia usando a chave do objeto Firebase
    record.objectID = dataSnapshot.key;
    // Adicionar ou atualizar o objeto
    index
        .saveObject(record)
        .then(() => {
            console.log('Firebase object indexed in Algolia', record.objectID);
        })
        .catch(error => {
            console.error('Error when indexing contact into Algolia', error);
            process.exit(1);
        });
}

/**
 * Deleta um determinado produto ouvido do firebase.
 * @param dataSnapshot
 */
function deleteIndexRecord(dataSnapshot) {
    // Obter o ID de objeto do Algolia em correspondência da chave do objeto Firebase
    const objectID = dataSnapshot.key;
    // Remove o objeto do Algolia
    index
        .deleteObject(objectID)
        .then(() => {
            console.log('Objeto Firebase excluído do Algolia', objectID);
        })
        .catch(error => {
            console.error('Erro ao excluir', error);
            process.exit(1);
        });
}