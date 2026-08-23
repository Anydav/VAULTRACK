import { Modal } from "../ui/model";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import SelectAccountStep from "./selectAccountStep";
import CreateAccountStep from "./createAccountStep";
import SelectAssetStep from "./selectAssetStep";
import AssetDetailsStep from "./addDetailStep";

const STEP_TITLES = {
  account: "Select Custodian",
  createAccount: "Add Custodian",
  asset: "Select Asset",
  details: "Asset Details",
};

export default function AddAssetModal() {
  const { isOpen, step, closeModal } = useAddAssetModal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={STEP_TITLES[step]}
      size={step === "account" ? "xl" : "md"}
    >
      {step === "account" && <SelectAccountStep />}
      {step === "createAccount" && <CreateAccountStep />}
      {step === "asset" && <SelectAssetStep />}
      {step === "details" && <AssetDetailsStep />}
    </Modal>
  );
}