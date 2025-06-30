import { getApi, disconnect } from '../api/api'
import { ChainIdRelay, getAllSupportedChains } from '../chains/chains'
import type { Api } from '../api/api'
import { paseoChain } from '../chains/supported-chains'
import { KnownChainId } from '../chains/chains'
import { getChainSpec } from '../clients/chainSpec'
import { start } from "polkadot-api/smoldot"
import { FixedSizeBinary } from 'polkadot-api'
import type { HrmpChannel } from '../types/hrmp'

export async function queryHrmpChannels(chain: ChainIdRelay): Promise<HrmpChannel[]> {

    const chains = getAllSupportedChains()
    const smoldot = start()
    const chainSpec = getChainSpec(chain)
    const api = await getApi(chain, chains, true, { enable: false, smoldot: smoldot, chainSpecs: { [chain]: chainSpec } })

    try {
        const channels = await api.query.Hrmp.HrmpChannels.getEntries()
        const hrmpChannels: HrmpChannel[] = []
        for (const entry of channels) {
            const [key] = entry.keyArgs
            const { sender, recipient } = key
            const { max_capacity, max_total_size, max_message_size, msg_count, total_size, mqc_head, sender_deposit } = entry.value
            hrmpChannels.push({ sender, recipient, max_capacity, max_total_size, max_message_size, msg_count, total_size, mqc_head, sender_deposit })
        }
        return hrmpChannels
    } finally {
        await disconnect(api)
    }
}


