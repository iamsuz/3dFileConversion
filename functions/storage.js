const config =  {
    storage: {
      default: 'minio',
      disks: {
        minio: {
          driver: 's3',
          key: 'minioadmin',
          secret: 'minioadmin',
          endpoint: 'https://minio.apps.fountane.io',
          bucket: 'virtu',
          s3ForcePathStyle: true,
          sslEnabled: true,

          config: {
            key: 'minioadmin',
            secret: 'minioadmin',
            endpoint: 'https://minio.apps.fountane.io',
            bucket: 'virtu',
            s3ForcePathStyle: true,
            sslEnabled: true,
          },
        },
        spaces: {
          driver: 's3',
          config: {
            key: process.env.SPACES_KEY || '',
            secret: process.env.SPACES_SECRET || '',
            endpoint: process.env.SPACES_ENDPOINT || '',
            bucket: process.env.SPACES_BUCKET || '',
            region: process.env.SPACES_REGION || '',
          },
        },
      },
    },

    gcp: {
      service_account_path: './config/creds/google-cloud-service-account.json',
      project_id: 'ops-studio',
      storage: {
        bucket_name: 'generic-staging',
      },
      firebase: {
        server_key: 'the server key',
      },
    },
  }


let { StorageManager } = require('@slynova/flydrive');
let storage = new StorageManager(config.storage);
// IF you are using google cloud storage
// const { GoogleCloudStorage } = require('@slynova/flydrive-gcs');
// storage.registerDriver('gcs', GoogleCloudStorage);

// If you are using s3
const { AmazonWebServicesS3Storage } = require('@slynova/flydrive-s3');
storage.registerDriver('s3', AmazonWebServicesS3Storage);

let disk_name = 'minio';

if (process.env.NODE_ENV === 'production') {
  disk_name = 'spaces';
}

let disk = storage.disk(disk_name);

console.log({ disk });

/**
    storage.disk(); // Returns the default disk (specified in the config)
    storage.disk('awsCloud'); // Returns the driver for the disk "s3"
    storage.disk('awsCloud', customConfig); // Overwrite the default configuration of the disk

*/

function upload(obj_key, file_data, options = null) {
  return disk.put(obj_key, file_data, options);
}

async function generateSignedUrl(key) {
  // Need to turn this into a promise.
  let signedUrl = await disk.getSignedUrl(key); //, {expiry: 60 * 5})
  console.log('The signed url is:   ', signedUrl);

  return signedUrl.signedUrl;
}

function deleteObject(obj_key) {
  return disk.delete(obj_key);
}

async function getBuffer(key) {
  try {
    return await disk.getBuffer(key);
  } catch (error) {
    console.log(error);
    return 'Files does not exist';
  }
}
async function getflatList(prefix) {
  let list = [];

  for await (const file of disk.flatList(prefix)) {
    list.push(file.path);
  }
  return list;
}

async function moveObject(from, to) {
  try {
    return await disk.move(from, to);
  } catch (error) {
    console.error(error)
    return false
  }
  
}

async function copyObject(from, to) {
  return await disk.copy(from, to);
}

async function checkExist(key){
  return await disk.exists(key)
}

module.exports = {
  upload: upload,
  getURL: generateSignedUrl,
  deleteObject: deleteObject,
  getBuffer: getBuffer,
  getflatList,
  moveObject,
  copyObject,
  checkExist
};

async function main() {
  //

  console.log('Putting data');

  let key = 'foo/bar/bar.txt';

  // put the data
  let putData = await disk.put(key, 'Foobar');
  console.log('The put data is');
  console.log(putData);

  // generate the signed url
  console.log('key is');
  console.log(key);
  let signedUrl = await disk.getSignedUrl(key, 60 * 5);
  console.log('The signed url is:   ', signedUrl);

  // now delete the data
  let is_deleted = await disk.delete(key);
  console.log('the deleted data is:  ', is_deleted);
}

if (require.main == module) {
  main();
}
