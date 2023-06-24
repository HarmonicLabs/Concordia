import { ChainSyncClient, ChainSyncRequestNext, MiniProtocol, Multiplexer, N2NHandshakeVersion, N2NMessageProposeVersion, chainSyncMessageFromCbor, n2nHandshakeMessageFromCbor, unwrapMultiplexerMessage } from "@harmoniclabs/ouroboros-miniprotocols-ts";
import { toHex } from "@harmoniclabs/uint8array-utils";
import { connect } from "net";

function logJson( thing: { toJson: () => any } ): void
{
    console.log( ++nBlocks, JSON.stringify( thing.toJson(), undefined, 4 ) );
}

const socket = "/media/michele/Data1/cardano/testnet/node/db/socket";

let nBlocks = 0;
void async function main(): Promise<void>
{
    const socket = connect({ host: "127.0.0.1", port: 3000 });

    socket.on("data", chunk => console.log( "\nsocket chunk", chunk.length, toHex( chunk ), "\n" ) );

    const mplexer = new Multiplexer(
        socket,
        {
            protocolType: "node-to-node",
            reconnect: 
            () => {
                if( socket.destroyed )
                return socket.connect({ host: "127.0.0.1", port: 3000 });
    
                return socket;
            }
        }
    );

    const client = new ChainSyncClient( mplexer );

    mplexer.onHandshake( msg => console.log( n2nHandshakeMessageFromCbor( msg ) ) );

    mplexer.send(
        new N2NMessageProposeVersion({
            versionTable: [
                {
                    version: N2NHandshakeVersion.v10,
                    data: {
                        networkMagic: 1,
                        initiatorAndResponderDiffusionMode: false
                    }
                }
            ]
        }).toCbor().toBuffer(),
        {
            hasAgency: true,
            protocol: MiniProtocol.Handshake
        }
    );

    mplexer.onChainSync( payload => {

        console.log( payload.length );
        console.log( toHex( payload ) );

    });

    client.onAwaitReply( logJson );
    client.onIntersectFound( logJson );
    client.onIntersectNotFound( logJson );
    client.onRollBackwards( logJson );
    client.onRollForward( logJson );

    await new Promise( r => setTimeout( r, 1000 ) );

    while( true )
    {
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();
        client.requestNext();

        await new Promise( r => setTimeout( r, 1 ) );
    }
}()