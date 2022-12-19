import { ActionRowBuilder, ButtonInteraction, ModalActionRowComponentBuilder, ModalBuilder, ModalMessageModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import Options from '../../../../../../constants/Options'
import NoirClient from '../../../../../../structures/Client'
import WelcomeMessage, { WelcomeMessageType } from '../../../../../../structures/WelcomeMessage'
import SettingsUtils from '../../SettingsUtils'
import WelcomeEditor from './WelcomeEditor'

export default class WelcomeEditorEmbed {
  public static async request(client: NoirClient, interaction: ButtonInteraction<'cached'>, id: string, type: WelcomeMessageType) {
    const messageData = await WelcomeMessage.cache(client, id, type)

    const colorInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEmbedColor', 'input'))
      .setLabel('Embed color')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter color hex or color name')
      .setValue(messageData.rawColor ?? '')
      .setRequired(false)
      .setMaxLength(10)
      .setMinLength(1)
    const descriptionInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEmbedDescription', 'input'))
      .setLabel('Embed description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter the description')
      .setValue(messageData.description ?? '')
      .setRequired(false)
      .setMaxLength(2000)
      .setMinLength(1)
    const imageInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEmbedImage', 'input'))
      .setLabel('Embed image')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter image URL or server, user, client')
      .setValue(messageData.rawImage ?? '')
      .setRequired(false)
      .setMaxLength(2000)
      .setMinLength(1)
    const thumbnailInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEmbedThumbnail', 'input'))
      .setLabel('Embed thumbnail')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter image URL or server, user, client')
      .setValue(messageData.rawThumbnail ?? '')
      .setRequired(false)
      .setMaxLength(2000)
      .setMinLength(1)
    const timestampInput = new TextInputBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, 'welcomeEmbedTimestamp', 'input'))
      .setLabel('Embed timestamp')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('True or false')
      .setValue(messageData.timestamp ? 'True' : 'False')
      .setRequired(false)
      .setMaxLength(5)
      .setMinLength(4)

    const actionRows = [
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(colorInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(descriptionInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(imageInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(thumbnailInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>()
        .addComponents(timestampInput)
    ]

    const modal = new ModalBuilder()
      .setCustomId(SettingsUtils.generateId('settings', id, `welcomeEditorEmbed.${type}`, 'modal'))
      .setTitle('Embed settings')
      .addComponents(actionRows)

    await interaction.showModal(modal)
  }

  public static async response(client: NoirClient, interaction: ModalMessageModalSubmitInteraction<'cached'>, id: string, type: WelcomeMessageType) {
    const messageData = await WelcomeMessage.cache(client, id, type)

    const colorInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEmbedColor', 'input'))
    const descriptionInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEmbedDescription', 'input'))
    const imageInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEmbedImage', 'input'))
    const thumbnailInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEmbedThumbnail', 'input'))
    const timestampInput = interaction.fields.getTextInputValue(SettingsUtils.generateId('settings', id, 'welcomeEmbedTimestamp', 'input'))

    if (colorInput) {
      messageData.rawColor = WelcomeMessage.formatRemove(colorInput)
      messageData.color = WelcomeMessage.formatColor(colorInput)
    }

    if (descriptionInput) {
      messageData.description = WelcomeMessage.formatRemove(descriptionInput)
    }

    if (imageInput) {
      const formatted = WelcomeMessage.formatVariable(imageInput, { client: { avatar: Options.clientAvatar }, guild: { icon: interaction.guild.iconURL() } })

      messageData.image = formatted == messageData.rawImage ? undefined : formatted
      messageData.rawImage = WelcomeMessage.formatRemove(imageInput)
    }

    if (thumbnailInput) {
      const formatted = WelcomeMessage.formatVariable(thumbnailInput, { client: { avatar: Options.clientAvatar }, guild: { icon: interaction.guild.iconURL() } })

      messageData.thumbnail = formatted == messageData.rawThumbnail ? undefined : formatted
      messageData.rawThumbnail = WelcomeMessage.formatRemove(thumbnailInput)
    }

    if (timestampInput) {
      messageData.timestamp = client.utils.formatBoolean(timestampInput)
    }

    await WelcomeEditor.initialMessage(client, interaction, id, type)
  }
}