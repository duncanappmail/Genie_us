
import type { Project, UploadedFile, BrandProfile, SavedProduct } from '../types';

const DB_NAME = 'GenieUsDB';
const DB_VERSION = 3; // Increment version for new schema
const PROJECTS_STORE_NAME = 'projects';
const FILES_STORE_NAME = 'files';
const BRAND_PROFILES_STORE_NAME = 'brandProfiles';
const SAVED_PRODUCTS_STORE_NAME = 'savedProducts';

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening database');
        };
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
                db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
                db.createObjectStore(FILES_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(BRAND_PROFILES_STORE_NAME)) {
                db.createObjectStore(BRAND_PROFILES_STORE_NAME, { keyPath: 'userId' });
            }
            if (!db.objectStoreNames.contains(SAVED_PRODUCTS_STORE_NAME)) {
                db.createObjectStore(SAVED_PRODUCTS_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const stripFileData = (file: UploadedFile | null): UploadedFile | null => {
    if (!file) return null;
    const { blob, base64, ...rest } = file;
    return rest as UploadedFile;
};

const getLeanProjectForStorage = (project: Project): Project => {
    const leanProject = JSON.parse(JSON.stringify(project));
    
    leanProject.productFile = stripFileData(leanProject.productFile);
    leanProject.generatedImages = leanProject.generatedImages.map(stripFileData);
    leanProject.generatedVideos = leanProject.generatedVideos.map(stripFileData);
    leanProject.referenceFiles = leanProject.referenceFiles.map(stripFileData);
    if (leanProject.startFrame) leanProject.startFrame = stripFileData(leanProject.startFrame);
    if (leanProject.endFrame) leanProject.endFrame = stripFileData(leanProject.endFrame);

    return leanProject;
};

const rehydrateFile = async (file: UploadedFile | null, filesStore: IDBObjectStore): Promise<UploadedFile | null> => {
    if (!file) return null;
    try {
        const fileRecord = await promisifyRequest<{ id: string, blob: Blob }>(filesStore.get(file.id));
        if (fileRecord) {
            return { ...file, blob: fileRecord.blob };
        }
    } catch (e) {
        console.error(`Failed to rehydrate file ${file.id}`, e);
    }
    return file;
};

const rehydrateProject = async (leanProject: Project, filesStore: IDBObjectStore): Promise<Project> => {
    const project = JSON.parse(JSON.stringify(leanProject));

    project.productFile = await rehydrateFile(project.productFile, filesStore);
    project.generatedImages = await Promise.all(project.generatedImages.map(f => rehydrateFile(f, filesStore)));
    project.generatedVideos = await Promise.all(project.generatedVideos.map(f => rehydrateFile(f, filesStore)));
    project.referenceFiles = await Promise.all(project.referenceFiles.map(f => rehydrateFile(f, filesStore)));
    if (project.startFrame) project.startFrame = await rehydrateFile(project.startFrame, filesStore);
    if (project.endFrame) project.endFrame = await rehydrateFile(project.endFrame, filesStore);

    return project;
};

export const saveProject = async (project: Project): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const filesToStore: UploadedFile[] = [
        project.productFile,
        ...project.generatedImages,
        ...project.generatedVideos,
        ...project.referenceFiles,
        project.startFrame,
        project.endFrame,
    ].filter((f): f is UploadedFile => !!f && !!f.blob);

    await Promise.all(filesToStore.map(file => 
        promisifyRequest(filesStore.put({ id: file.id, blob: file.blob }))
    ));

    const leanProject = getLeanProjectForStorage(project);
    await promisifyRequest(projectsStore.put(leanProject));

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getProjectsForUser = async (userId: string): Promise<Project[]> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readonly');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const allLeanProjects: Project[] = await promisifyRequest(projectsStore.getAll());
    const userProjects = allLeanProjects.filter(p => p.userId === userId);
    
    const hydratedProjects = await Promise.all(
        userProjects.map(p => rehydrateProject(p, filesStore))
    );

    return hydratedProjects.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const projectsStore = tx.objectStore(PROJECTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProject: Project = await promisifyRequest(projectsStore.get(projectId));
    if (leanProject) {
        const fileIds = [
            leanProject.productFile,
            ...leanProject.generatedImages,
            ...leanProject.generatedVideos,
            ...leanProject.referenceFiles,
            leanProject.startFrame,
            leanProject.endFrame,
        ].filter(Boolean).map(f => f!.id);

        await Promise.all(fileIds.map(id => promisifyRequest(filesStore.delete(id))));
    }

    await promisifyRequest(projectsStore.delete(projectId));
    
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// --- Saved Products Library ---

export const saveProductToLibrary = async (product: SavedProduct): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([SAVED_PRODUCTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const productStore = tx.objectStore(SAVED_PRODUCTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    if (product.file.blob) {
        await promisifyRequest(filesStore.put({ id: product.file.id, blob: product.file.blob }));
    }

    const leanProduct = {
        ...product,
        file: stripFileData(product.file)
    };

    await promisifyRequest(productStore.put(leanProduct));

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getSavedProductsForUser = async (userId: string): Promise<SavedProduct[]> => {
    const db = await getDB();
    const tx = db.transaction([SAVED_PRODUCTS_STORE_NAME, FILES_STORE_NAME], 'readonly');
    const productStore = tx.objectStore(SAVED_PRODUCTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const allLeanProducts: SavedProduct[] = await promisifyRequest(productStore.getAll());
    const userProducts = allLeanProducts.filter(p => p.userId === userId);

    const hydratedProducts = await Promise.all(
        userProducts.map(async p => ({
            ...p,
            file: (await rehydrateFile(p.file, filesStore)) as UploadedFile
        }))
    );

    return hydratedProducts.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteProductFromLibrary = async (productId: string): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([SAVED_PRODUCTS_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const productStore = tx.objectStore(SAVED_PRODUCTS_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProduct: SavedProduct = await promisifyRequest(productStore.get(productId));
    if (leanProduct && leanProduct.file) {
        await promisifyRequest(filesStore.delete(leanProduct.file.id));
    }

    await promisifyRequest(productStore.delete(productId));

    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// --- Brand Profile Functions ---

export const saveBrandProfile = async (profile: BrandProfile): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);
    
    const { logoFile, ...leanProfile } = profile;
    
    if (logoFile && logoFile.blob) {
        await promisifyRequest(filesStore.put({ id: logoFile.id, blob: logoFile.blob }));
    }
    
    const profileToStore = {
        ...leanProfile,
        logoFile: logoFile ? stripFileData(logoFile) : null
    };

    await promisifyRequest(profilesStore.put(profileToStore));
};

export const getBrandProfile = async (userId: string): Promise<BrandProfile | null> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readonly');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProfile = await promisifyRequest<any>(profilesStore.get(userId));
    if (!leanProfile) return null;

    if (leanProfile.logoFile) {
        leanProfile.logoFile = await rehydrateFile(leanProfile.logoFile, filesStore);
    }
    
    return leanProfile as BrandProfile;
};

export const deleteBrandProfile = async (userId: string): Promise<void> => {
    const db = await getDB();
    const tx = db.transaction([BRAND_PROFILES_STORE_NAME, FILES_STORE_NAME], 'readwrite');
    const profilesStore = tx.objectStore(BRAND_PROFILES_STORE_NAME);
    const filesStore = tx.objectStore(FILES_STORE_NAME);

    const leanProfile = await promisifyRequest<any>(profilesStore.get(userId));

    if (leanProfile && leanProfile.logoFile) {
        try {
            await promisifyRequest(filesStore.delete(leanProfile.logoFile.id));
        } catch (e) {
            console.error(`Failed to delete logo file ${leanProfile.logoFile.id}`, e);
        }
    }
    
    await promisifyRequest(profilesStore.delete(userId));
};
