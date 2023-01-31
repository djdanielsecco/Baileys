import { Boom } from '@hapi/boom'
import makeWASocket, { AnyMessageContent, Browsers, delay, DisconnectReason, fetchLatestBaileysVersion, isJidBroadcast, makeCacheableSignalKeyStore, makeInMemoryStore, MessageRetryMap, useMultiFileAuthState } from '../'
import MAIN_LOGGER from '../Utils/logger'
import DbConnections from "./connection"
import { RandonMessage } from "./mens"
const logger = MAIN_LOGGER.child({})
logger.level = 'debug'

const useStore = !process.argv.includes('--no-store')
console.log('useStore: ', useStore);
const doReplies = !process.argv.includes('--no-reply')
// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap: MessageRetryMap = {}
const isOn = true
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined
store?.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store?.writeToFile('./baileys_store_multi.json')
}, 10_000)
let rex = /^(55)([0-9]{2})([0-9]{8,9})@([c|b|s|g]{1})(\S*)\.[u|s|n|e|t]{2,3}$/s
// start a connection
DbConnections.mongo().then(async (db: any) => {
	const startSock = async () => {
		const MyModel = db.model('contactwhats', new db.Schema({
			"_id": {
				"$oid": {
					"type": "ObjectId"
				}
			}
		}, { strict: false, timestamps: true }));
		const logs_mdb = db.model('bootlogs', new db.Schema({
			"_id": {
				"$oid": {
					"type": "ObjectId"
				}
			},
			"id": {
				"type": "Mixed"
			}
		}, { strict: false, timestamps: true }));

		async function waitingTimer(delay: number) {
			return new Promise((resolve: any) => setTimeout(() => resolve(), delay))
		}
		const resolver: any = (cb: any, delay: number) =>
			new Promise((resolve: any) =>
				setTimeout(() => resolve(cb), delay),
			);

		function arred(d: number, casas: number) {
			var aux = Math.pow(10, casas);
			return Math.floor(d * aux) / aux;
		}
		function getRandomInter(max: number) {
			return Math.floor(Math.random() * max);
		}
		function getRandomInt(max: number) {
			let min = 5
			let rnd = Math.random() * (max - min) + min;
			let wr = arred(rnd, 3)
			return wr
		}



		const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
		// fetch latest version of WA Web
		const { version, isLatest } = await fetchLatestBaileysVersion()
		// console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

		const sock = makeWASocket({
			version,
			logger,
			printQRInTerminal: true,
			auth: {
				creds: state.creds,
				/** caching makes the store faster to send/recv messages */
				keys: makeCacheableSignalKeyStore(state.keys, logger),
			},
			browser: Browsers.ubuntu('Desktop'),
			msgRetryCounterMap,
			generateHighQualityLinkPreview: true,
			// ignore all broadcast messages -- to receive the same
			// comment the line below out
			// shouldIgnoreJid: jid => isJidBroadcast(jid),
			// implement to handle retries
			// getMessage: async key => {
			// 	if (store) {
			// 		const msg = await store.loadMessage(key.remoteJid!, key.id!)
			// 		return msg?.message || undefined
			// 	}

			// 	// only if store is present
			// 	return {
			// 		conversation: 'hello'
			// 	}
			// }
		})
		let responder = {}
		let arr: any[]
		store?.bind(sock.ev)

		const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
			// await sock.presenceSubscribe(jid)
			// await delay(500)

			// await sock.sendPresenceUpdate('composing', jid)
			await delay(2000)

			// await sock.sendPresenceUpdate('paused', jid)

			await sock.sendMessage(jid, msg)
		}

		// class MSM {
		// 	id = ""
		// 	// message?:any
		// 	jid?: any
		// 	constructor(jid, id) {

		// 		this.id = id

		// 		this.jid = jid;
		// 	}

		// 	async log() {

		// 		let del = arred(1000 * getRandomInt(4), 0)
		// 		delay(del)
		// 		await MyModel.findOneAndUpdate({ Celular: this.id }, { bitSendText: true})
		// 		await sendMessageWTyping({ text: RandonMessage() },this.jid)
		// 		// console.log('mens.RandonMessage(): ', RandonMessage());
		// 	}
		// }

		// the process function lets you process all events that just occurred
		// efficiently in a batch
		let final
		sock.ev.process(
			// events is a map for event name => event data
			async (events) => {
				// something about the connection changed
				// maybe it closed, or we received all offline message or connection opened
				if (events['connection.update']) {
					const update = events['connection.update']
					console.log('update: ', update);
					const { connection, lastDisconnect } = update
					if (connection === 'close') {
						// reconnect if not logged out
						if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
							startSock()
						} else {
							console.log('Connection closed. You are logged out.')
						}
					}

					console.log('connection update')
					if (connection === 'open') {
						if (isOn) {
							try {
								final = await MyModel.find({ bitSendText: false, bitAtivo: true,bitVerify: false,bitNotificacao: false }).limit(126).skip(900)
								console.log('final: ', final?.length);
								await waitingTimer(3000)
								console.log("Vai começar");

								// const id = '199820413'
								// const [result] = await sock!.onWhatsApp(id)
								// if (result?.exists) {
								// 	console.log (`${id} exists on WhatsApp, as jid: ${result?.jid}`)

								// 	delay(1000)
								// 	sendMessageWTyping({ text: RandonMessage() },result?.jid)
								// }else{
								// 	console.log("no user");
								// }
								arr = []
								for await (let x of final) {
									console.time("for")
									console.log('x.Celular: ', x.Celular);
									let delay = arred(1000 * getRandomInt(10), 0)
									let numb = `+55${x.Celular}`
									const [result] = await sock!.onWhatsApp(numb)
									if (result?.exists) {

										try {
											let jid = result?.jid
											let validRex = rex.test(jid)
											console.log(`${jid}    >>>>>>>>isValid`, validRex);
											const status = await sock.fetchStatus(jid).catch(e=>e) ?? []
											const profile = await sock!.getBusinessProfile(jid).catch(e=>e) ?? []
                                       
											console.log("status", status)
											console.log("profile", profile)
											if (validRex) {
												await MyModel.findOneAndUpdate({ Celular: x.Celular }, { bitVerify: true })
												let prod = () => resolver(() => {

													return {

														jid,
														Celular: x.Celular,
														// men: p1[getRandomInter(11)],
														delay,

													}
												},55000+ delay)

												arr.push(prod)

											} else {
												await MyModel.findOneAndUpdate({ Celular: x.Celular }, { bitAtivo: false })
											}
										} catch (error) {
											console.log('error: ', error);
											// let doc = new Logger({ typex: 'message_error', Celular: x.Celular, error })
											// await Logger.insertMany(doc)
											await MyModel.findOneAndUpdate({ Celular: x.Celular }, { bitAtivo: false })
										}

									} else {
										await MyModel.findOneAndUpdate({ Celular: x.Celular }, { bitAtivo: false })
									}

									console.timeEnd("for")
								}
								await waitingTimer(3000)
								console.log("Vai logar");
								let d = Math.round(arr.length / 30)   //% ((arr.length % 30 ))
								let r = Math.ceil(arr.length / d)   //% ((arr.length % 30 ))
								let bb = Array(d - 1).fill("")
								let cc: any = []
								console.log({
									len: arr.length,
									division: d,
									block: r
								});
								bb.forEach((v, k) => {
									cc.push(k + 1)
								})
								for await (let [y, k] of arr.entries()) {

									let ff = await Promise.resolve(k())
									let sent = ff()



									let reg = await MyModel.findOne({ Celular: sent.Celular, bitVerify: true, bitSendText: false })

									console.log('reg: ', sent);
									if ((!!reg?.bitVerify === true)) {
										// if (true) {

										// responder[`a${sent.Celular}a`] = new MSM(sent.jid, sent.Celular)
										// await waitingTimer(200)
										// responder[`a${sent.Celular}a`].log()
									}
									// await chat.sendMessage(sent.men);
									// await MyModel.findOneAndUpdate({ Celular: sent.Celular }, { bitSendText: true })
									// await sendMessageWTyping({ text: RandonMessage() }, sent.jid)
									console.log(y, "/", arr.length);
									await waitingTimer(200)
									if (cc.includes(y / r)) {
										console.log(`stop at ${new Date}`);
										console.log(`return at ${new Date(Date.now() + 60000 * 10)}`);
										await waitingTimer(60000 * 10)
									}
									delete arr[y]

								}
								await waitingTimer(200)
								arr = []
								await waitingTimer(200)
								console.log("acabou");

							} catch (error) {
								console.log('error:>>>>>>>>>>> ', error);

							}
						} else {
							// const ids = ['19982044413', "3192881839",
							// 	"3188692458",]
							// for await (let id of ids) {
							// 	await waitingTimer(2000)
							// 	const [result] = await sock!.onWhatsApp(id)
							// 	if (result?.exists) {
							// 		console.log(`${id} exists on WhatsApp, as jid: ${result?.jid}`)

							// 		delay(1000)
							// 		sendMessageWTyping({ text: RandonMessage() }, result?.jid)
							// 	} else {
							// 		console.log("no user");
							// 	}
							// }

						}
					}
					// console.log('connection update', update)
				}

				// credentials updated -- save them
				if (events['creds.update']) {
					await saveCreds()
				}

				// if(events.call) {
				// 	console.log('recv call event', events.call)
				// }

				// history received
				// if (events['messaging-history.set']) {
				// 	const { chats, contacts, messages, isLatest } = events['messaging-history.set']

				// 	// if(isLatest){
				// 	// 	console.log('isLatest: ', isLatest);

				// 	// }
				// 	console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`)
				// }

				// received a new message


				if (events['messages.upsert']) {
					const upsert = events['messages.upsert']
					
					if (upsert.type === 'notify') {
						for (const msg of upsert.messages) {
							if (!msg.key.fromMe && doReplies) {
								console.log('replying to', msg.key.remoteJid)
								await sock!.readMessages([msg.key])
								console.log('recv messages ', JSON.stringify(msg.message, undefined, 2))
								// await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid!)
							}
						}
					}
				}

				// messages updated like status delivered, message deleted etc.





				// if (events['messages.update']) {
				// 	let msg = events['messages.update']

				// 	// console.log("masg up", JSON.stringify(msg, undefined, 2))
				// 	for (let x of events['messages.update']) {
				// 		if (x.key.fromMe && doReplies) {
				// 		console.log('x: ', x);
				// 		let cell:string|null|undefined = x?.key?.remoteJid 
				// 		console.log('cell: ', cell);
				// 		let isValid = rex.test(cell as string)
				// 		if(isValid){let ob:any = rex.exec(cell as string)
				// 		let cellx = ob[2] + ob[3]
				// 		console.log('cellx: ', cellx);
				// 		let reg = await MyModel.findOne({ Celular:cellx, bitVerify: true ,bitSendText: true })

				// 		// console.log('reg: ', reg);
				// 		if ((!!reg?.bitSendText === true)) {
				// 			if (responder?.[`a${cellx}a`]?.id === cellx) {
				// 		delete responder[`a${cellx}a`]
				// 			}}
				// 		}
				// 	}else{
				// 		console.log('x: upsssss>>>>>> ', x);
				// 	}

				// 	}
				// 	// if (responder?.[`a${cell}a`]?.id === cell) {
				// 	// 	delete responder[`a${cell}a`]

				// 	// }
				// }

				// if (events['message-receipt.update']) {
				// 	let msg = events['message-receipt.update']
				// 	console.log('message-receipt.update', JSON.stringify(msg, undefined, 2))
				// }

				// if(events['messages.reaction']) {
				// 	console.log(events['messages.reaction'])
				// }

				// if(events['presence.update']) {
				// 	console.log(events['presence.update'])
				// }

				// if(events['chats.update']) {
				// 	console.log(events['chats.update'])
				// }

				if (events['contacts.update']) {
					for (const contact of events['contacts.update']) {
						if (typeof contact.imgUrl !== 'undefined') {
							const newUrl = contact.imgUrl === null
								? null
								: await sock!.profilePictureUrl(contact.id!).catch(() => null)
							// console.log(
							// 	`contact ${contact.id} has a new profile pic: ${newUrl}`,
							// )
						}
					}
				}

				if (events['chats.delete']) {
					console.log('chats deleted ', events['chats.delete'])
				}
			}
		)


		return sock
	}

	startSock()
})